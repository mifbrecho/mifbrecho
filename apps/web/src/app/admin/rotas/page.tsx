"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { orderNumber } from "@/lib/orders";
import { phoneToWhatsappNumber, whatsappLink } from "@/lib/store-info";

type RouteOrder = {
  id: string;
  status: string;
  shipping_street: string | null;
  shipping_number: string | null;
  shipping_complement: string | null;
  shipping_neighborhood: string | null;
  shipping_city: string | null;
  shipping_reference: string | null;
  notes: string | null;
  customer: { full_name: string | null; phone: string | null } | null;
};

const SELECT =
  "id, status, shipping_street, shipping_number, shipping_complement, shipping_neighborhood, shipping_city, shipping_reference, notes, customer:profiles(full_name, phone)";

// Pedidos que ainda estão em algum ponto da entrega (retirada na loja não entra aqui)
const DELIVERABLE_STATUSES = ["paid", "preparing", "shipped"];

function isPickup(order: RouteOrder): boolean {
  return (order.notes ?? "").startsWith("Retirada");
}

function addressLine(order: RouteOrder): string {
  return [
    [order.shipping_street, order.shipping_number].filter(Boolean).join(", "),
    order.shipping_complement,
    order.shipping_reference,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function RotasPage() {
  const [orders, setOrders] = useState<RouteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("orders")
        .select(SELECT)
        .in("status", DELIVERABLE_STATUSES)
        .order("shipping_neighborhood", { ascending: true });

      if (queryError) {
        setError(queryError.message);
      } else {
        const deliverable = ((data ?? []) as unknown as RouteOrder[]).filter(
          (o) => !isPickup(o)
        );
        setOrders(deliverable);
      }

      setLoading(false);
    }

    load();

    // Assim que um pedido muda de status em qualquer lugar (a irmã marcando
    // "Entregue" no painel, ou a cliente confirmando o recebimento), a
    // lista se atualiza sozinha, sem precisar recarregar a página.
    const channel = supabase
      .channel("rotas-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const groups = orders.reduce<Record<string, RouteOrder[]>>((acc, order) => {
    const key = order.shipping_neighborhood?.trim() || "Sem bairro informado";
    acc[key] = acc[key] ?? [];
    acc[key].push(order);
    return acc;
  }, {});

  const neighborhoods = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-text">Rotas de entrega</h1>
        <p className="text-sm text-text-muted">
          Pedidos pagos ou em separação, agrupados por bairro, pra organizar a
          saída de entrega.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-text-muted shadow-sm">
          Carregando...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-text-muted shadow-sm">
          Nenhum pedido pronto pra entrega no momento.
        </div>
      ) : (
        <div className="space-y-6">
          {neighborhoods.map((neighborhood) => (
            <div key={neighborhood}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">
                {neighborhood} ({groups[neighborhood].length})
              </h2>

              <div className="space-y-3">
                {groups[neighborhood].map((order) => {
                  const wa = whatsappLink(
                    `Oi${order.customer?.full_name ? `, ${order.customer.full_name.split(" ")[0]}` : ""}! Aqui é da MIF BRECHO, tô a caminho com seu pedido #${orderNumber(order.id)} 💕`,
                    phoneToWhatsappNumber(order.customer?.phone) ?? ""
                  );

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-primary-light bg-white p-4 shadow-sm"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <p className="font-semibold text-text">
                          {order.customer?.full_name || "Cliente"}
                        </p>
                        <span className="whitespace-nowrap text-xs text-text-muted">
                          #{orderNumber(order.id)}
                        </span>
                      </div>

                      <p className="text-sm text-text-muted">
                        📍 {addressLine(order)}
                        {order.shipping_city ? ` — ${order.shipping_city}` : ""}
                      </p>

                      {order.customer?.phone && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline"
                        >
                          Avisar no WhatsApp
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
