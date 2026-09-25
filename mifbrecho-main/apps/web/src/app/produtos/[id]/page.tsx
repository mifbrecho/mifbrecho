"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, Heart } from "lucide-react";
import type { Product } from "@mifre/shared";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const addItem = useCart((s) => s.addItem);
  const inCart = useCart(
    (s) => s.items.find((i) => i.product.id === id)?.quantity ?? 0
  );

  const router = useRouter();
  const pathname = usePathname();
  const isFavorite = useFavorites((s) => s.ids.includes(id));
  const loadFavorites = useFavorites((s) => s.load);
  const toggleFavorite = useFavorites((s) => s.toggle);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // Ex.: id antigo/inválido (como "p1") não é um UUID → tratamos como não encontrado
        console.error("Erro ao carregar produto:", error);
      }

      setProduct(!error && data ? normalizeProduct(data) : null);
      setLoading(false);
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <p className="text-text-muted">Carregando peça...</p>
        </div>
      </div>
    );
  }

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
    // O carrinho não deixa passar do estoque (peça única = 1 unidade)
    const result = addItem(product!);

    if (result === "added") {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  async function handleToggleFavorite() {
    const result = await toggleFavorite(product!.id);

    if (result === "login") {
      window.alert("Entre ou crie sua conta para adicionar aos favoritos.");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (result === "error") {
      window.alert("Não foi possível salvar o favorito. Tente de novo.");
    }
  }

  const soldOut = product.stock < 1;
  const alreadyInCart = !soldOut && inCart >= product.stock;

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

            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={
                isFavorite
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
              aria-pressed={isFavorite}
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105"
            >
              <Heart
                className={`h-6 w-6 ${
                  isFavorite ? "fill-primary text-primary" : "text-primary"
                }`}
              />
            </button>
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
                disabled={soldOut || (alreadyInCart && !added)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 rounded-full hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                <ShoppingBag className="w-5 h-5" />
                {soldOut
                  ? "Esgotado"
                  : added
                  ? "Adicionado! ✓"
                  : alreadyInCart
                  ? "Já está no carrinho"
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
