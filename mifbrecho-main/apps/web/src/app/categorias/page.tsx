import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/products";
import type { Category } from "@mifre/shared";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "available")
      .order("created_at", { ascending: false }),
  ]);

  if (categoriesResult.error) {
    console.error("Erro ao carregar categorias:", categoriesResult.error);
  }

  if (productsResult.error) {
    console.error("Erro ao carregar produtos:", productsResult.error);
  }

  const categories = (categoriesResult.data ?? []) as Category[];
  const products = (productsResult.data ?? []).map(normalizeProduct);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            MIF BRECHO
          </p>

          <h1 className="text-3xl font-bold text-text md:text-4xl">
            Categorias
          </h1>

          <p className="mt-2 text-text-muted">
            Encontre suas peças favoritas por categoria.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              className="rounded-full border border-primary-light bg-white px-5 py-2.5 text-sm font-medium text-text transition hover:bg-primary hover:text-white"
            >
              {category.name}
            </a>
          ))}
        </div>

        <div className="space-y-12">
          {categories.map((category) => {
            const categoryProducts = products.filter(
              (product) =>
                product.category_id === category.id &&
                product.status === "available"
            );

            return (
              <section
                key={category.id}
                id={category.slug}
                className="scroll-mt-24"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text">
                      {category.name}
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                      {categoryProducts.length}{" "}
                      {categoryProducts.length === 1 ? "peça disponível" : "peças disponíveis"}
                    </p>
                  </div>

                  <Link
                    href="/produtos"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>

                {categoryProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-primary-light bg-white p-8 text-center">
                    <p className="text-text-muted">
                      Nenhuma peça disponível nesta categoria no momento.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
