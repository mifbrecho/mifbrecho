"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderSummary {
  status: string;
  total_amount: number;
  created_at: string;
}

interface ProductSummary {
  status: string;
  stock: number;
  price: number;
}

// Pedidos que já foram pagos (contam como venda)
const PAID_STATUSES = ["paid", "preparing", "shipped", "delivered"];

function StatCard({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string;
  value: string | number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition ${
        highlight
          ? "border-primary bg-primary/5"
          : "border-primary-light bg-white"
      } ${href ? "hover:shadow-md" : ""}`}
    >
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-primary" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminResumoPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [ordersResult, productsResult] = await Promise.all([
        supabase.from("orders").select("status, total_amount, created_at"),
        supabase.from("products").select("status, stock, price"),
      ]);

      if (ordersResult.error || productsResult.error) {
        setError(
          ordersResult.error?.message ||
            productsResult.error?.message ||
            "Erro ao carregar o resumo."
        );
      } else {
        setOrders((ordersResult.data ?? []) as OrderSummary[]);
        setProducts((productsResult.data ?? []) as ProductSummary[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidOrders = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const paidThisMonth = paidOrders.filter(
    (o) => new Date(o.created_at) >= monthStart
  );

  const revenueTotal = paidOrders.reduce((s, o) => s + o.total_amount, 0);
  const revenueMonth = paidThisMonth.reduce((s, o) => s + o.total_amount, 0);
  const ticket =
    paidOrders.length > 0 ? Math.round(revenueTotal / paidOrders.length) : 0;

  const toSeparate = orders.filter((o) => o.status === "paid").length;
  const awaitingPix = orders.filter((o) => o.status === "pending_payment").length;

  const forSale = products.filter((p) => p.status === "available" && p.stock > 0);
  const sold = products.filter((p) => p.status === "sold").length;
  const hidden = products.filter((p) => p.status === "hidden").length;
  const stockValue = forSale.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-text">Resumo</h1>
      <p className="mb-6 text-sm text-text-muted">
        Vendas e estoque da loja em um só lugar.
      </p>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-text-muted shadow-sm">
          Carregando resumo...
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Precisa da sua atenção
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Pagos, para separar"
                value={toSeparate}
                href="/admin/pedidos?status=paid"
                highlight={toSeparate > 0}
              />
              <StatCard
                label="Aguardando Pix"
                value={awaitingPix}
                href="/admin/pedidos?status=pending_payment"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Vendas
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Faturamento do mês"
                value={formatPrice(revenueMonth)}
              />
              <StatCard
                label="Faturamento total"
                value={formatPrice(revenueTotal)}
              />
              <StatCard label="Pedidos pagos" value={paidOrders.length} />
              <StatCard label="Ticket médio" value={formatPrice(ticket)} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Estoque
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Peças à venda" value={forSale.length} />
              <StatCard label="Peças vendidas" value={sold} />
              <StatCard label="Peças ocultas" value={hidden} />
              <StatCard
                label="Valor em estoque"
                value={formatPrice(stockValue)}
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/produtos"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              + Cadastrar peça
            </Link>
            <Link
              href="/admin/pedidos"
              className="rounded-xl border border-primary px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Ver todos os pedidos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
