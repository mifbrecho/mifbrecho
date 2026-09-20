import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export default function FavoritosPage() {
  const favoriteProducts = mockProducts.filter(
    (product) => product.status === "available"
  );

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

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary-light bg-white p-10 text-center">
            <p className="text-text-muted">
              Você ainda não tem favoritos.
            </p>

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
