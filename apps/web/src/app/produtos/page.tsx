"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@mifre/shared";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        setProducts([]);
      } else {
        setProducts(data as Product[]);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

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
              {products.length} peça
              {products.length !== 1 ? "s" : ""} disponível
              {products.length !== 1 ? "is" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-muted">
            <p>Carregando peças...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg">
              Nenhuma peça disponível no momento 💕
            </p>
            <p className="text-sm mt-2">
              Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
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
