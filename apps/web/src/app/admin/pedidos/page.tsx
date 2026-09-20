"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface MockOrder {
  id: string;
  customerName: string;
  phone: string;
  total: number;
  status: OrderStatus;
  items: string[];
  address: string;
  createdAt: string;
}

const initialOrders: MockOrder[] = [
  {
    id: "ord-001",
    customerName: "Ana Silva",
    phone: "(11) 98765-4321",
    total: 7990,
    status: "paid",
    items: ["Vestido Floral Rosa (M)"],
    address: "Rua das Flores, 123 - Jardim Primavera - São Paulo/SP",
    createdAt: new Date().toLocaleString("pt-BR"),
  },
  {
    id: "ord-002",
    customerName: "Juliana Costa",
    phone: "(11) 91234-5678",
    total: 4990,
    status: "pending_payment",
    items: ["Blusa Branca Babados (P)"],
    address: "Av. Paulista, 1000 - Bela Vista - São Paulo/SP",
    createdAt: new Date(Date.now() - 3600000).toLocaleString("pt-BR"),
  },
];

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Aguardando Pix",
  paid: "Pago — separar",
  preparing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColor: Record<OrderStatus, string> = {
  pending_payment: "bg-warning/20 text-warning",
  paid: "bg-primary/15 text-primary",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState(initialOrders);

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-white/80 text-sm">
          ← Voltar
        </Link>
        <h1 className="font-bold">Pedidos</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-text-muted py-12">
            Nenhum pedido ainda
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-primary-light p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-text">{order.customerName}</p>
                  <p className="text-xs text-text-muted">{order.phone}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {order.createdAt}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status]}`}
                >
                  {statusLabel[order.status]}
                </span>
              </div>

              <ul className="text-sm text-text-muted mb-2">
                {order.items.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>

              <p className="text-sm text-text-muted mb-3">
                📍 {order.address}
              </p>

              <div className="flex items-center justify-between">
                <p className="font-bold text-primary">
                  {formatPrice(order.total)}
                </p>

                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value as OrderStatus)
                  }
                  className="text-xs border border-primary-light rounded-lg px-2 py-1.5"
                >
                  {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}

        <p className="text-xs text-center text-text-muted pt-4">
          Quando o Pix for confirmado automaticamente, o pedido aparece aqui e a
          peça sai do estoque.
        </p>
      </main>
    </div>
  );
}
