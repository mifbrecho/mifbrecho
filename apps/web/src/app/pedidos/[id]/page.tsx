"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_DETAIL_SELECT,
  ORDER_STEPS,
  ORDER_STATUS,
  formatOrderDate,
  itemImageUrl,
  orderNumber,
  statusInfo,
  type OrderRow,
} from "@/lib/orders";

export default function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      // Só abre pedido que pertence a esta conta
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_DETAIL_SELECT)
        .eq("id", id)
        .eq("customer_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Erro ao carregar pedido:", error);
      }

      setOrder(!error && data ? (data as unknown as OrderRow) : null);
      setLoading(false);
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function copyPix() {
    if (!order?.pix_copy_paste) return;

    navigator.clipboard.writeText(order.pix_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const backLink = (
    <Link
      href="/pedidos"
      className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      Meus pedidos
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center text-text-muted">
          <p>Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-text-muted">
            Entre na sua conta para ver este pedido.
          </p>
          <Link
            href={`/login?next=/pedidos/${id}`}
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center">
          <p className="text-text-muted">Pedido não encontrado</p>
          <Link href="/pedidos" className="mt-4 inline-block text-primary">
            Voltar para meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  const info = statusInfo(order.status);
  const cancelled = order.status === "cancelled";
  const currentStep = ORDER_STEPS.findIndex((step) => step === order.status);
  const items = order.items ?? [];

  const addressLine1 = [order.shipping_street, order.shipping_number]
    .filter(Boolean)
    .join(", ");
  const addressLine2 = [order.shipping_complement, order.shipping_neighborhood]
    .filter(Boolean)
    .join(" · ");
  const addressLine3 = [
    [order.shipping_city, order.shipping_state].filter(Boolean).join(" - "),
    order.shipping_zip_code,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        {backLink}

        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text">
              Pedido #{orderNumber(order.id)}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Feito em {formatOrderDate(order.created_at)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${info.badge}`}
          >
            {info.label}
          </span>
        </div>

        {/* Andamento */}
        <section className="mb-6 rounded-2xl border border-primary-light/60 bg-white p-5 shadow-sm">
          {info.hint && (
            <p className="mb-4 text-sm text-text-muted">{info.hint}</p>
          )}

          {!cancelled && (
            <ol className="flex items-start justify-between gap-1">
              {ORDER_STEPS.map((step, index) => {
                const done = index <= currentStep;

                return (
                  <li
                    key={step}
                    className="flex flex-1 flex-col items-center text-center"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-primary text-white"
                          : "bg-secondary text-text-muted"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span
                      className={`mt-1.5 text-[11px] leading-tight ${
                        done ? "font-medium text-text" : "text-text-muted"
                      }`}
                    >
                      {ORDER_STATUS[step].label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Pix pendente */}
        {order.status === "pending_payment" && order.pix_copy_paste && (
          <section className="mb-6 rounded-2xl border border-primary-light bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-semibold text-text">Pague com Pix</h2>
            <div className="mb-3 rounded-xl bg-secondary p-3">
              <p className="break-all font-mono text-xs text-text">
                {order.pix_copy_paste}
              </p>
            </div>
            <button
              type="button"
              onClick={copyPix}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3 font-semibold text-primary hover:bg-primary/5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar código Pix
                </>
              )}
            </button>
          </section>
        )}

        {/* Peças */}
        <section className="mb-6 rounded-2xl border border-primary-light/60 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-text">Peças do pedido</h2>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <Image
                    src={itemImageUrl(item.product)}
                    alt={item.product?.title ?? "Peça"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-text">
                    {item.product?.title ?? "Peça"}
                  </p>
                  {item.product?.size && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Tam: {item.product.size}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-muted">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>

                <p className="text-sm font-semibold text-text">
                  {formatPrice(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-primary-light pt-4">
            <span className="font-bold text-text">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </section>

        {/* Entrega */}
        {addressLine1 && (
          <section className="rounded-2xl border border-primary-light/60 bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-semibold text-text">Endereço de entrega</h2>
            <p className="text-sm text-text">{addressLine1}</p>
            {addressLine2 && (
              <p className="text-sm text-text-muted">{addressLine2}</p>
            )}
            {addressLine3 && (
              <p className="text-sm text-text-muted">{addressLine3}</p>
            )}
            {order.shipping_reference && (
              <p className="mt-1 text-xs text-text-muted">
                Ref.: {order.shipping_reference}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
