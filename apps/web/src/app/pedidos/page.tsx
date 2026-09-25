"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_LIST_SELECT,
  formatOrderDate,
  itemImageUrl,
  orderNumber,
  statusInfo,
  type OrderRow,
} from "@/lib/orders";

type AuthState = "checking" | "guest" | "ready";

export default function MeusPedidosPage() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function start() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuth("guest");
        setLoadingOrders(false);
        return;
      }

      setAuth("ready");

      // Traz só os pedidos desta conta (o banco também garante isso via RLS)
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_LIST_SELECT)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar pedidos:", error);
        setOrders([]);
      } else {
        setOrders((data ?? []) as unknown as OrderRow[]);
      }

      setLoadingOrders(false);
    }

    start();
  }, []);

  const isLoading = auth === "checking" || (auth === "ready" && loadingOrders);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            MIF BRECHO
          </p>

          <h1 className="text-3xl font-bold text-text md:text-4xl">
            Meus pedidos
          </h1>

          <p className="mt-2 text-text-muted">
            Acompanhe aqui o andamento das suas compras.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-text-muted">
            <p>Carregando pedidos...</p>
          </div>
        ) : auth === "guest" ? (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">
              Entre na sua conta para ver seus pedidos.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?next=/pedidos"
                className="inline-block rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="inline-block rounded-full border border-primary px-6 py-3 font-medium text-primary transition hover:bg-primary/5"
              >
                Criar conta
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">Você ainda não fez nenhum pedido.</p>

            <Link
              href="/produtos"
              className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Ver peças
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const info = statusInfo(order.status);
              const items = order.items ?? [];
              const preview = items.slice(0, 3);
              const extra = items.length - preview.length;

              return (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className="block rounded-2xl border border-primary-light/60 bg-white p-5 shadow-sm transition hover:border-primary"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">
                        Pedido #{orderNumber(order.id)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatOrderDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${info.badge}`}
                    >
                      {info.label}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    {preview.map((item) => (
                      <div
                        key={item.id}
                        className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-secondary"
                      >
                        <Image
                          src={itemImageUrl(item.product)}
                          alt={item.product?.title ?? "Peça"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}

                    {extra > 0 && (
                      <span className="text-xs text-text-muted">
                        +{extra} peça{extra > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-primary-light pt-3">
                    <span className="text-sm text-text-muted">
                      {items.length} peça{items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
