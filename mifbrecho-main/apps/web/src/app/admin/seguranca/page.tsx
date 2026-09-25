"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "none" | "enrolling" | "active";

export default function SegurancaPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();

      // totp = autenticadores já confirmados
      setStatus(data && data.totp.length > 0 ? "active" : "none");
    }

    load();
  }, []);

  async function startEnroll() {
    setError("");
    setBusy(true);

    const supabase = createClient();

    // limpa tentativas antigas que ficaram sem confirmar
    const { data: existing } = await supabase.auth.mfa.listFactors();

    for (const factor of existing?.all ?? []) {
      if (factor.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Celular da loja",
      issuer: "MIF BRECHO",
    });

    if (enrollError || !data) {
      console.error("Erro ao configurar autenticador:", enrollError);
      setError("Não foi possível iniciar a configuração. Tente de novo.");
      setBusy(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
    setBusy(false);
  }

  async function confirm(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setBusy(true);

    const supabase = createClient();

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challenge) {
      setError("Não foi possível conferir o código. Tente de novo.");
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Código incorreto. Confira o app e digite os 6 números atuais.");
      setBusy(false);
      return;
    }

    // a partir daqui este login já está com a verificação feita
    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-text">Segurança do painel</h1>
      <p className="mb-6 text-sm text-text-muted">
        Verificação em duas etapas: além da senha, o painel pede um código do
        app autenticador do seu celular.
      </p>

      {status === "loading" && (
        <p className="text-sm text-text-muted">Carregando...</p>
      )}

      {status === "active" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p className="font-semibold">Verificação em duas etapas ativa ✓</p>
          <p className="mt-1">
            Este painel já pede o código do seu app autenticador a cada login.
          </p>
        </div>
      )}

      {status === "none" && (
        <div className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-text-muted">
            Para usar o painel, configure o app autenticador. Tenha no celular o
            Google Authenticator, o Microsoft Authenticator ou outro app
            parecido.
          </p>

          <button
            type="button"
            onClick={startEnroll}
            disabled={busy}
            className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Preparando..." : "Configurar agora"}
          </button>
        </div>
      )}

      {status === "enrolling" && (
        <form
          onSubmit={confirm}
          className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm"
        >
          <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-text-muted">
            <li>Abra o app autenticador e toque em adicionar (+).</li>
            <li>Leia o QR Code abaixo com a câmera do app.</li>
            <li>Digite aqui o código de 6 números que o app mostrar.</li>
          </ol>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="QR Code para o app autenticador"
            className="mx-auto mb-3 h-48 w-48"
          />

          <p className="mb-4 break-all text-center text-xs text-text-muted">
            Se não conseguir ler o QR Code, digite esta chave no app:
            <br />
            <span className="font-mono text-text">{secret}</span>
          </p>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mb-3 w-full rounded-xl border border-primary-light px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-primary"
            required
          />

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Conferindo..." : "Confirmar"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
