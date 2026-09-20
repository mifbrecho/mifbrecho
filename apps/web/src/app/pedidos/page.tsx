"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ShoppingBag } from "lucide-react";
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

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      // .eq("customer_id") garante que só aparecem os pedidos DESTA conta
      // (o admin também só vê os próprios aqui; os pedidos da loja ficam no /admin)
      const { data, error: queryError } = await supabase
        .from("orders")
        .select(ORDER_LIST_SELECT)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Erro ao carregar pedidos:", queryError);
        setError(true);
      } else {
        setOrders((data ?? []) as unknown as OrderRow[]);
      }

      setLoading(false);
    }

    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            MIF BRECHO
          </p>
          <h1 className="text-3xl font-bold text-text">Meus pedidos</h1>
          <p className="mt-2 text-text-muted">
            Acompanhe suas compras e o andamento de cada pedido.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-text-muted">
            <p>Carregando pedidos...</p>
          </div>
        ) : !loggedIn ? (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">
              Entre na sua conta para ver seus pedidos.
            </p>
            <Link
              href="/login?next=/pedidos"
              className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Não foi possível carregar seus pedidos agora. Tente de novo em
            instantes.
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-primary-light" />
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
              const totalPieces = items.reduce((sum, i) => sum + i.quantity, 0);

              return (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className="block rounded-2xl border border-primary-light/60 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">
                        Pedido #{orderNumber(order.id)}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatOrderDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${info.badge}`}
                    >
                      {info.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-14 w-11 overflow-hidden rounded-lg bg-secondary"
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

                    {items.length > 4 && (
                      <span className="text-xs text-text-muted">
                        +{items.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-text-muted">
                      {totalPieces} {totalPieces === 1 ? "peça" : "peças"}
                    </p>

                    <div className="flex items-center gap-1">
                      <p className="font-bold text-primary">
                        {formatPrice(order.total_amount)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
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
