"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VerificarPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setBusy(true);

    const supabase = createClient();

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.[0];

    if (!factor) {
      window.location.href = "/admin/seguranca";
      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });

    if (challengeError || !challenge) {
      setError("Não foi possível conferir o código. Tente de novo.");
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Código incorreto. Digite os 6 números que o app mostra agora.");
      setCode("");
      setBusy(false);
      return;
    }

    // só aceita voltar para dentro do painel
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext =
      next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

    window.location.href = safeNext;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-text">Código de segurança</h1>
      <p className="mb-6 text-sm text-text-muted">
        Abra o app autenticador no celular e digite o código de 6 números da MIF
        BRECHO.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm"
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          autoFocus
          className="mb-3 w-full rounded-xl border border-primary-light px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-primary"
          required
        />

        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Conferindo..." : "Entrar no painel"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
