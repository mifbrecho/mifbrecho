import type { Product, ProductImage } from "@mifre/shared";

/**
 * Busca o produto JUNTO com as fotos da tabela product_images.
 * Sem isso, o Supabase devolve só a tabela products (sem foto).
 * O apelido "images" é o nome que o site já espera (product.images).
 */
export const PRODUCT_SELECT = "*, images:product_images(*)";

type ImageRow = ProductImage & { created_at?: string };

/**
 * Organiza as fotos: a principal vem primeiro.
 * Se houver mais de uma principal (ex.: a foto foi trocada na edição),
 * vale a mais nova.
 */
export function normalizeProduct(row: unknown): Product {
  const product = row as Product;
  const images = [...((product.images ?? []) as ImageRow[])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  return { ...product, images };
}
