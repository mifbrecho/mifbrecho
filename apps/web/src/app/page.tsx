import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export default function HomePage() {
  const highlights = mockProducts
    .filter((p) => p.status === "available")
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-primary-light via-secondary to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4">
              Peças com{" "}
              <span className="text-primary">história</span>
              <br />e muito carinho
            </h1>
            <p className="text-base text-text-muted max-w-md mx-auto mb-8">
              Bem-vinda ao MIF BRECHO. Roupas selecionadas, preços justos e
              pagamento só no Pix.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-primary-dark transition"
            >
              Ver peças
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-text mb-6 text-center">
            Novidades
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlights.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/produtos"
              className="text-primary font-medium hover:underline"
            >
              Ver todas as peças →
            </Link>
          </div>
        </section>

        <section className="bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-text mb-8 text-center">
              Como funciona
            </h2>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3 text-2xl">
                  👗
                </div>
                <h3 className="font-semibold text-text mb-1">Escolha</h3>
                <p className="text-sm text-text-muted">
                  Veja as peças e adicione no carrinho
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3 text-2xl">
                  📱
                </div>
                <h3 className="font-semibold text-text mb-1">Pague no Pix</h3>
                <p className="text-sm text-text-muted">
                  Rápido, seguro e sem cartão
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3 text-2xl">
                  🚚
                </div>
                <h3 className="font-semibold text-text mb-1">Receba</h3>
                <p className="text-sm text-text-muted">
                  Entrega com carinho pela loja
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary-dark text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-bold text-lg mb-1">MIF BRECHO</p>
          <p className="text-primary-light text-sm mb-3">
            Peças selecionadas com amor 💕
          </p>
          <p className="text-xs text-primary-light/70">
            © {new Date().getFullYear()} MIF BRECHO
          </p>
        </div>
      </footer>
    </div>
  );
}
