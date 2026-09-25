"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { phoneToWhatsappNumber, whatsappLink } from "@/lib/store-info";
import {
  formatOrderDate,
  isPickupOrder,
  itemImageUrl,
  orderNumber,
  statusInfo,
  type OrderRow,
} from "@/lib/orders";
import type { OrderStatus } from "@mifre/shared";

type AdminOrder = OrderRow & {
  customer: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

type Filter = "all" | OrderStatus;

const STATUS_ORDER: OrderStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

const ADMIN_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Aguardando Pix",
  paid: "Pago — separar",
  preparing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const SELECT = `*, customer:profiles(full_name, phone, email), items:order_items(id, quantity, unit_price, product:products(id, title, size, images:product_images(url, is_primary, sort_order)))`;

function deliveryMessage(order: AdminOrder, address: string): string {
  const firstName = (order.customer?.full_name ?? "").trim().split(" ")[0];

  const items = (order.items ?? [])
    .map(
      (item) =>
        `• ${item.product?.title ?? "Peça"}${
          item.product?.size ? ` (${item.product.size})` : ""
        }`
    )
    .join("\n");

  return [
    `Olá${firstName ? `, ${firstName}` : ""}! Aqui é da MIF BRECHO 💕`,
    `Recebemos o seu pedido #${orderNumber(order.id)}:`,
    items,
    `Total das peças: ${formatPrice(order.total_amount)}`,
    address ? `Endereço de entrega: ${address}` : "",
    "Vou ver o valor da entrega e já te passo por aqui, tudo bem?",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error: queryError } = await supabase
      .from("orders")
      .select(SELECT)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setOrders((data ?? []) as unknown as AdminOrder[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // Abre já filtrado quando vem do resumo (ex.: /admin/pedidos?status=paid)
    const fromUrl = new URLSearchParams(window.location.search).get("status");

    if (fromUrl && STATUS_ORDER.includes(fromUrl as OrderStatus)) {
      setFilter(fromUrl as OrderStatus);
    }

    loadOrders();
  }, []);

  async function changeStatus(order: AdminOrder, newStatus: OrderStatus) {
    if (newStatus === order.status) return;

    if (newStatus === "cancelled") {
      const confirmed = window.confirm(
        `Cancelar o pedido #${orderNumber(order.id)}?\n\nAs peças voltam para a loja automaticamente. Um pedido cancelado não pode ser reaberto.`
      );

      if (!confirmed) return;
    }

    setError("");
    setMessage("");
    setSavingId(order.id);

    const previous = order.status;

    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (updateError) {
      setOrders((current) =>
        current.map((o) => (o.id === order.id ? { ...o, status: previous } : o))
      );
      setError(
        updateError.message.includes("PEDIDO_CANCELADO_NAO_REABRE")
          ? "Um pedido cancelado não pode ser reaberto. Peça para a cliente fazer um novo pedido."
          : `Não foi possível mudar o status: ${updateError.message}`
      );
    } else {
      setMessage(
        `Pedido #${orderNumber(order.id)} agora está: ${ADMIN_LABEL[newStatus]}.`
      );
    }

    setSavingId(null);
  }

  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
    {} as Record<OrderStatus, number>
  );

  const byStatus =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const searchTerm = normalize(search);
  const visible = searchTerm
    ? byStatus.filter((o) => {
        const haystack = [
          o.customer?.full_name,
          o.customer?.phone,
          o.customer?.email,
          orderNumber(o.id),
        ]
          .filter(Boolean)
          .join(" ");

        return normalize(haystack).includes(searchTerm);
      })
    : byStatus;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Pedidos</h1>
          <p className="text-sm text-text-muted">
            Acompanhe e atualize o andamento de cada pedido.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="rounded-lg border border-primary-light bg-white px-3 py-2 text-sm text-text hover:bg-secondary disabled:opacity-60"
        >
          Atualizar
        </button>
      </div>

      {/* Busca */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, telefone ou nº do pedido..."
          className="w-full rounded-xl border border-primary-light bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-white text-text-muted border border-primary-light"
          }`}
        >
          Todos ({orders.length})
        </button>

        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === s
                ? "bg-primary text-white"
                : "bg-white text-text-muted border border-primary-light"
            }`}
          >
            {ADMIN_LABEL[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-text-muted shadow-sm">
          Carregando pedidos...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-text-muted shadow-sm">
          {orders.length === 0
            ? "Nenhum pedido ainda. Quando uma cliente comprar, ele aparece aqui."
            : searchTerm
            ? "Nenhum pedido encontrado pra essa busca."
            : "Nenhum pedido neste filtro."}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => {
            const info = statusInfo(order.status);
            const customer = order.customer;

            const addressParts = [
              [order.shipping_street, order.shipping_number]
                .filter(Boolean)
                .join(", "),
              order.shipping_complement,
              order.shipping_neighborhood,
              [order.shipping_city, order.shipping_state]
                .filter(Boolean)
                .join(" - "),
              order.shipping_zip_code,
            ]
              .filter(Boolean)
              .join(" · ");

            const address = isPickupOrder(order)
              ? "Retirada com a loja"
              : addressParts;

            const wa = whatsappLink(
              deliveryMessage(order, address),
              phoneToWhatsappNumber(customer?.phone) ?? ""
            );

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text">
                      {customer?.full_name || customer?.email || "Cliente"}
                    </p>

                    {customer?.email && customer.full_name && (
                      <p className="text-xs text-text-muted">{customer.email}</p>
                    )}

                    {customer?.phone && (
                      <p className="text-xs text-text-muted">
                        {customer.phone}
                        {wa && (
                          <>
                            {" · "}
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              WhatsApp
                            </a>
                          </>
                        )}
                      </p>
                    )}

                    <p className="mt-0.5 text-xs text-text-muted">
                      Pedido #{orderNumber(order.id)} ·{" "}
                      {formatOrderDate(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${info.badge}`}
                  >
                    {info.label}
                  </span>
                </div>

                <div className="mb-3 space-y-2">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itemImageUrl(item.product)}
                        alt={item.product?.title ?? "Peça"}
                        className="h-14 w-11 flex-shrink-0 rounded-lg bg-secondary object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-text">
                          {item.product?.title ?? "Peça"}
                          {item.product?.size ? ` (${item.product.size})` : ""}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {address && (
                  <p className="mb-3 text-sm text-text-muted">📍 {address}</p>
                )}

                {order.status !== "cancelled" && (
                  <div className="mb-3">
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Combinar entrega no WhatsApp
                    </a>

                    {!customer?.phone && (
                      <p className="mt-1.5 text-xs text-text-muted">
                        Esta cliente ainda não tem telefone cadastrado. Escolha o
                        contato dela no WhatsApp.
                      </p>
                    )}
                  </div>
                )}

                {order.notes && (
                  <p className="mb-3 rounded-lg bg-secondary px-3 py-2 text-xs text-text-muted">
                    📦 {order.notes}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">
                    {formatPrice(order.total_amount)}
                  </p>

                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      changeStatus(order, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-primary-light bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {ADMIN_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
