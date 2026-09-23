"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/products";
import type { Category, Product } from "@mifre/shared";

type PriceRange = "all" | "under30" | "30to60" | "over60";

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: "all", label: "Qualquer preço" },
  { value: "under30", label: "Até R$ 30" },
  { value: "30to60", label: "R$ 30 a R$ 60" },
  { value: "over60", label: "Acima de R$ 60" },
];

/** Preço vem em centavos no banco (ex: 4990 = R$ 49,90) */
function matchesPriceRange(priceInCents: number, range: PriceRange): boolean {
  if (range === "all") return true;
  if (range === "under30") return priceInCents < 3000;
  if (range === "30to60") return priceInCents >= 3000 && priceInCents <= 6000;
  return priceInCents > 6000;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("status", "available")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
      ]);

      if (productsResult.error) {
        console.error("Erro ao carregar produtos:", productsResult.error);
        setProducts([]);
      } else {
        setProducts((productsResult.data ?? []).map(normalizeProduct));
      }

      if (categoriesResult.error) {
        console.error("Erro ao carregar categorias:", categoriesResult.error);
        setCategories([]);
      } else {
        setCategories((categoriesResult.data ?? []) as Category[]);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // Tamanhos que realmente existem nas peças cadastradas (sem repetir)
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((product) => {
      if (product.size) sizes.add(product.size);
    });
    return Array.from(sizes).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (categoryId !== "all" && product.category_id !== categoryId) {
        return false;
      }
      if (size !== "all" && product.size !== size) {
        return false;
      }
      if (!matchesPriceRange(product.price, priceRange)) {
        return false;
      }
      return true;
    });
  }, [products, categoryId, size, priceRange]);

  const hasActiveFilter =
    categoryId !== "all" || size !== "all" || priceRange !== "all";

  function clearFilters() {
    setCategoryId("all");
    setSize("all");
    setPriceRange("all");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text">
            Todas as peças
          </h1>

          {loading ? (
            <p className="text-sm text-text-muted mt-1">
              Carregando peças...
            </p>
          ) : (
            <p className="text-sm text-text-muted mt-1">
              {filteredProducts.length} peça
              {filteredProducts.length !== 1 ? "s" : ""} disponível
              {filteredProducts.length !== 1 ? "is" : ""}
            </p>
          )}
        </div>

        {!loading && (
          <div className="mb-6 space-y-3">
            {/* Categorias */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId("all")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  categoryId === "all"
                    ? "border-primary bg-primary text-white"
                    : "border-primary-light bg-white text-text hover:bg-primary/5"
                }`}
              >
                Todas categorias
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    categoryId === category.id
                      ? "border-primary bg-primary text-white"
                      : "border-primary-light bg-white text-text hover:bg-primary/5"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Faixa de preço */}
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => setPriceRange(range.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    priceRange === range.value
                      ? "border-primary bg-primary text-white"
                      : "border-primary-light bg-white text-text hover:bg-primary/5"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Tamanho */}
            {availableSizes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-text-muted">
                  Tamanho:
                </label>

                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  className="rounded-full border border-primary-light bg-white px-4 py-1.5 text-sm text-text outline-none"
                >
                  <option value="all">Todos</option>
                  {availableSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-text-muted">
            <p>Carregando peças...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg">
              {hasActiveFilter
                ? "Nenhuma peça encontrada com esse filtro 💕"
                : "Nenhuma peça disponível no momento 💕"}
            </p>
            <p className="text-sm mt-2">
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-semibold text-primary hover:underline"
                >
                  Limpar filtros
                </button>
              ) : (
                "Volte em breve!"
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
