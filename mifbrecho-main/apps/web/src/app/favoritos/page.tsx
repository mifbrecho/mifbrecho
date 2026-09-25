"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@mifre/shared";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/products";
import { useFavorites } from "@/store/favorites";

export default function FavoritosPage() {
  const ids = useFavorites((s) => s.ids);
  const loaded = useFavorites((s) => s.loaded);
  const isLoggedIn = useFavorites((s) => s.isLoggedIn);
  const loadFavorites = useFavorites((s) => s.load);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (!loaded) return;

    if (!isLoggedIn) {
      setLoadingProducts(false);
      return;
    }

    async function loadProducts() {
      const supabase = createClient();

      // Só traz os favoritos da própria usuária (o banco garante isso)
      const { data, error } = await supabase
        .from("favorites")
        .select(`created_at, product:products(${PRODUCT_SELECT})`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar favoritos:", error);
        setProducts([]);
      } else {
        setProducts(
          (data ?? [])
            // peça que já foi vendida/ocultada não aparece mais
            .filter((row: { product: unknown }) => row.product)
            .map((row: { product: unknown }) => normalizeProduct(row.product))
        );
      }

      setLoadingProducts(false);
    }

    loadProducts();
  }, [loaded, isLoggedIn]);

  // Ao tirar o coração aqui, a peça some da lista na hora
  const favoriteProducts = products.filter((product) =>
    ids.includes(product.id)
  );

  const isLoading = !loaded || loadingProducts;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            MIF BRECHO
          </p>

          <h1 className="text-3xl font-bold text-text md:text-4xl">
            Meus favoritos
          </h1>

          <p className="mt-2 text-text-muted">
            Suas peças favoritas aparecem aqui.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-text-muted">
            <p>Carregando favoritos...</p>
          </div>
        ) : !isLoggedIn ? (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">
              Entre na sua conta para ver e salvar seus favoritos.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?next=/favoritos"
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
        ) : favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">Você ainda não tem favoritos.</p>

            <Link
              href="/produtos"
              className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              Ver peças
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
