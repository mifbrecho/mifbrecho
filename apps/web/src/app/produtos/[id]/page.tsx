"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { mockProducts } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = mockProducts.find((p) => p.id === id);
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <p className="text-text-muted">Peça não encontrada</p>
          <Link href="/produtos" className="text-primary mt-4 inline-block">
            Voltar para as peças
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl =
    product.images?.find((i) => i.is_primary)?.url ||
    product.images?.[0]?.url ||
    "https://placehold.co/600x800/FCE4EC/E91E63?text=MIF+BRECHO";

  function handleAddToCart() {
    addItem(product!);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/produtos"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagem */}
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
              priority
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex gap-2 mb-3">
              {product.condition && (
                <span className="text-xs font-medium bg-secondary text-primary px-2.5 py-1 rounded-full">
                  {product.condition}
                </span>
              )}
              {product.brand && (
                <span className="text-xs font-medium bg-secondary text-text-muted px-2.5 py-1 rounded-full">
                  {product.brand}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text mb-2">{product.title}</h1>
            <p className="text-3xl font-bold text-primary mb-4">
              {formatPrice(product.price)}
            </p>

            {product.size && (
              <p className="text-sm text-text-muted mb-2">
                Tamanho: <span className="font-medium text-text">{product.size}</span>
              </p>
            )}

            {product.description && (
              <p className="text-text-muted text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            <div className="mt-auto space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock < 1}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 rounded-full hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                <ShoppingBag className="w-5 h-5" />
                {product.stock < 1
                  ? "Esgotado"
                  : added
                  ? "Adicionado! ✓"
                  : "Adicionar ao carrinho"}
              </button>

              <Link
                href="/carrinho"
                className="block w-full text-center border-2 border-primary text-primary font-semibold py-3.5 rounded-full hover:bg-primary/5 transition"
              >
                Ver carrinho
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
