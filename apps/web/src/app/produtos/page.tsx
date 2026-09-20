import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export default function ProdutosPage() {
  const products = mockProducts.filter((p) => p.status === "available");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text">Todas as peças</h1>
          <p className="text-sm text-text-muted mt-1">
            {products.length} peça{products.length !== 1 ? "s" : ""} disponível
            {products.length !== 1 ? "is" : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg">Nenhuma peça disponível no momento 💕</p>
            <p className="text-sm mt-2">Volte em breve!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
