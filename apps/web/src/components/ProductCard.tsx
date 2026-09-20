"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@mifare/shared";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const FAVORITES_KEY = "mifbrecho-favorites";

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.images?.find((i) => i.is_primary)?.url ||
    product.images?.[0]?.url ||
    "https://placehold.co/400x500/FCE4EC/E91E63?text=MIF+BRECHO";

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);

    if (saved) {
      const favorites: string[] = JSON.parse(saved);
      setIsFavorite(favorites.includes(product.id));
    }
  }, [product.id]);

  function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const saved = localStorage.getItem(FAVORITES_KEY);
    const favorites: string[] = saved ? JSON.parse(saved) : [];

    let updatedFavorites: string[];

    if (favorites.includes(product.id)) {
      updatedFavorites = favorites.filter((id) => id !== product.id);
      setIsFavorite(false);
    } else {
      updatedFavorites = [...favorites, product.id];
      setIsFavorite(true);
    }

    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(updatedFavorites)
    );
  }

  return (
    <div className="group block overflow-hidden rounded-2xl border border-primary-light/60 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Link href={`/produtos/${product.id}`} className="block h-full">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
            unoptimized
          />
        </Link>

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isFavorite
              ? `Remover ${product.title} dos favoritos`
              : `Adicionar ${product.title} aos favoritos`
          }
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite
                ? "fill-primary text-primary"
                : "text-primary"
            }`}
          />
        </button>

        {product.condition && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-primary">
            {product.condition}
          </span>
        )}
      </div>

      <Link href={`/produtos/${product.id}`} className="block">
        <div className="p-3">
          <h3 className="min-h-[2.5rem] line-clamp-2 text-sm font-medium text-text">
            {product.title}
          </h3>

          <div className="mt-1 flex items-center justify-between">
            <p className="font-bold text-primary">
              {formatPrice(product.price)}
            </p>

            {product.size && (
              <span className="rounded bg-secondary px-2 py-0.5 text-xs text-text-muted">
                {product.size}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
