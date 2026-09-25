"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { useCart, type CartRefreshResult } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

function buildNotices(result: CartRefreshResult): string[] {
  const notices: string[] = [];

  if (result.removed.length > 0) {
    notices.push(
      `Saiu do carrinho porque não está mais disponível: ${result.removed.join(", ")}.`
    );
  }

  if (result.adjusted.length > 0) {
    notices.push(
      `Quantidade ajustada ao estoque: ${result.adjusted.join(", ")}.`
    );
  }

  if (result.priceChanged.length > 0) {
    notices.push(`O preço mudou: ${result.priceChanged.join(", ")}.`);
  }

  return notices;
}

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, totalAmount, clear, refresh } =
    useCart();
  const total = totalAmount();

  const [checking, setChecking] = useState(true);
  const [notices, setNotices] = useState<string[]>([]);

  // Ao abrir o carrinho, confere com o banco o que ainda está à venda
  useEffect(() => {
    let cancelled = false;

    refresh()
      .then((result) => {
        if (!cancelled) setNotices(buildNotices(result));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noticeBox =
    notices.length > 0 ? (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
        {notices.map((notice) => (
          <p key={notice}>{notice}</p>
        ))}
      </div>
    ) : null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-full max-w-md">{noticeBox}</div>
          <ShoppingBag className="w-16 h-16 text-primary-light mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">Carrinho vazio</h1>
          <p className="text-text-muted text-sm mb-6 text-center">
            Adicione algumas peças lindas para começar
          </p>
          <Link
            href="/produtos"
            className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:bg-primary-dark transition"
          >
            Ver peças
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">Seu carrinho</h1>
          <button
            onClick={clear}
            className="text-sm text-text-muted hover:text-error"
          >
            Limpar
          </button>
        </div>

        {noticeBox}

        <div className="space-y-4 mb-8">
          {items.map(({ product, quantity }) => {
            const imageUrl =
              product.images?.find((i) => i.is_primary)?.url ||
              product.images?.[0]?.url ||
              "https://placehold.co/200x250/FCE4EC/E91E63?text=MIF+BRECHO";

            const canChooseQuantity = product.stock > 1;

            return (
              <div
                key={product.id}
                className="flex gap-4 bg-white rounded-2xl p-4 border border-primary-light/50 shadow-sm"
              >
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text text-sm line-clamp-2">
                    {product.title}
                  </h3>
                  {product.size && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Tam: {product.size}
                    </p>
                  )}
                  <p className="text-primary font-bold mt-1">
                    {formatPrice(product.price)}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {canChooseQuantity ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-8 h-8 rounded-full border border-primary-light flex items-center justify-center text-primary hover:bg-secondary"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="w-8 h-8 rounded-full border border-primary-light flex items-center justify-center text-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">
                        Peça única · 1 unidade
                      </span>
                    )}

                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 text-text-muted hover:text-error"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-2xl border border-primary-light p-5 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-text-muted">Entrega</span>
            <span className="text-text-muted">A combinar</span>
          </div>
          <div className="border-t border-primary-light pt-3 flex justify-between items-center">
            <span className="font-bold text-text">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>

          {checking ? (
            <div className="mt-5 block w-full text-center bg-primary/60 text-white font-semibold py-4 rounded-full cursor-wait">
              Conferindo disponibilidade...
            </div>
          ) : (
            <Link
              href="/checkout"
              className="mt-5 block w-full text-center bg-primary text-white font-semibold py-4 rounded-full hover:bg-primary-dark transition shadow-lg shadow-primary/25"
            >
              Finalizar compra
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
