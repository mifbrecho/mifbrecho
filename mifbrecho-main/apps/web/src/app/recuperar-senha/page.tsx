"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0); // muda pra recriar o widget

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!captchaToken) {
      setError("Confirme que você não é um robô.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
        captchaToken,
      }
    );

    // o token só vale uma tentativa — pede um novo sempre
    setCaptchaToken("");
    setCaptchaKey((key) => key + 1);

    setLoading(false);

    if (resetError) {
      console.error("Erro ao pedir redefinição de senha:", resetError);

      if (resetError.status === 429) {
        setError(
          "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
        );
      } else {
        setError(
          "Não foi possível enviar o e-mail agora. Tente de novo em instantes."
        );
      }

      return;
    }

    // Mesma mensagem exista ou não uma conta com esse e-mail (por segurança)
    setSent(true);
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
              <Mail size={28} />
            </div>

            <h1 className="text-3xl font-bold text-[#3d302b]">
              Esqueci minha senha
            </h1>

            <p className="mt-2 text-[#806f67]">
              Digite o e-mail da sua conta e enviaremos um link para criar uma
              nova senha.
            </p>
          </div>

          {sent ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                Se existir uma conta com esse e-mail, enviamos um link para
                criar uma nova senha. Confira também a caixa de spam. O link
                vale por pouco tempo.
              </div>

              <Link
                href="/login"
                className="block w-full rounded-xl border border-[#eadfd8] px-5 py-3 text-center font-semibold text-[#3d302b] transition hover:bg-[#fff7f2]"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Turnstile
                key={captchaKey}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken("")}
              />

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d302b] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
