"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { orderNumber } from "@/lib/orders";

type PaidAlert = {
  id: string;
  orderId: string;
  total: number;
};

/**
 * Avisa quem está com o painel aberto sempre que um pedido é marcado como
 * pago: toca um som e mostra um cartão na tela. Não depende de notificação
 * push do sistema (Google/Apple) — funciona em qualquer navegador, incluindo
 * celulares sem os serviços do Google. Fica "escutando" via Supabase
 * Realtime, então só dispara para pedidos pagos DEPOIS que o painel foi
 * aberto (não repete avisos antigos).
 */
export default function PaidOrderAlert() {
  const [alerts, setAlerts] = useState<PaidAlert[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  function getAudioContext(): AudioContext | null {
    try {
      type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
      const Ctx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }

  // Os navegadores só deixam tocar som depois de alguma interação da
  // pessoa na página. Aproveitamos o primeiro toque/clique/tecla pra
  // "destravar" o áudio, assim quando o aviso real chegar o som já sai.
  useEffect(() => {
    function unlock() {
      if (unlockedRef.current) return;
      const ctx = getAudioContext();
      if (ctx?.state === "suspended") ctx.resume();
      unlockedRef.current = true;
    }

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playBeep = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;

    // Duas notas curtas, tipo campainha — não precisa de nenhum arquivo
    // de áudio, então funciona offline e não depende de baixar nada.
    [
      { start: 0, freq: 880 },
      { start: 0.18, freq: 1175 },
    ].forEach(({ start, freq }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.32);
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setAlerts((current) => current.filter((a) => a.id !== id));
  }, []);

  // Enquanto tiver aviso não visto: repete o som de tempos em tempos e
  // pisca o título da aba, pra dar pra perceber mesmo com o painel em
  // outra aba ou minimizado.
  useEffect(() => {
    const originalTitle = document.title;

    if (alerts.length === 0) {
      document.title = originalTitle.replace(/^🔔 /, "");
      return;
    }

    playBeep();
    const soundInterval = window.setInterval(playBeep, 12000);

    let flip = false;
    const titleInterval = window.setInterval(() => {
      flip = !flip;
      document.title = flip ? `🔔 Novo pedido! (${alerts.length})` : originalTitle;
    }, 1500);

    return () => {
      window.clearInterval(soundInterval);
      window.clearInterval(titleInterval);
      document.title = originalTitle;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length, playBeep]);

  // Escuta em tempo real qualquer pedido que vire "paid" (tanto uma
  // atualização de status quanto, por garantia, um pedido já criado como
  // pago). Isso cobre o caminho normal: pending_payment -> paid quando o
  // Mercado Pago confirma o Pix.
  useEffect(() => {
    const supabase = createClient();

    function handleNewPaidOrder(row: { id: string; total_amount: number }) {
      setAlerts((current) => [
        { id: `${row.id}-${Date.now()}`, orderId: row.id, total: row.total_amount },
        ...current,
      ]);
    }

    const channel = supabase
      .channel("admin-pedidos-pagos")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: "status=eq.paid" },
        (payload) => handleNewPaidOrder(payload.new as { id: string; total_amount: number })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: "status=eq.paid" },
        (payload) => handleNewPaidOrder(payload.new as { id: string; total_amount: number })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex flex-col items-center gap-2 p-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 shadow-lg"
        >
          <div className="min-w-0">
            <p className="font-bold text-green-800">💰 Novo pedido pago!</p>
            <p className="text-sm text-green-700">
              Pedido #{orderNumber(alert.orderId)} · {formatPrice(alert.total)}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href="/admin/pedidos?status=paid"
              onClick={() => dismiss(alert.id)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Ver
            </a>
            <button
              type="button"
              onClick={() => dismiss(alert.id)}
              className="rounded-lg bg-white px-2 py-1.5 text-xs text-green-700 hover:bg-green-100"
            >
              OK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
