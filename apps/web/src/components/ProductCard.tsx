"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@mifre/shared";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.images?.find((i) => i.is_primary)?.url ||
    product.images?.[0]?.url ||
    "https://placehold.co/400x500/FCE4EC/E91E63?text=MIF+BRECHO";

  return (
    <Link
      href={`/produtos/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-primary-light/60 shadow-sm hover:shadow-md transition"
    >
      <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition duration-300"
          sizes="(max-width: 640px) 50vw, 25vw"
          unoptimized
        />
        {product.condition && (
          <span className="absolute top-2 left-2 bg-white/90 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
            {product.condition}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-text text-sm line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-primary font-bold">{formatPrice(product.price)}</p>
          {product.size && (
            <span className="text-xs text-text-muted bg-secondary px-2 py-0.5 rounded">
              {product.size}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
