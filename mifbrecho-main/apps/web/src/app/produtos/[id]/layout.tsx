import type { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@supabase/supabase-js";

// Título, descrição e foto de cada peça quando o link é compartilhado ou aparece no Google
export const revalidate = 300;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductMeta = {
  title: string;
  size: string | null;
  brand: string | null;
  price: number;
  images: { url: string; is_primary: boolean; sort_order: number }[] | null;
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) return {};

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    // Só peças à venda aparecem aqui (o banco esconde as outras)
    const { data } = await supabase
      .from("products")
      .select("title, size, brand, price, images:product_images(url, is_primary, sort_order)")
      .eq("id", id)
      .maybeSingle();

    const product = data as ProductMeta | null;

    if (!product) return {};

    const price = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(product.price / 100);

    const images = [...(product.images ?? [])].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });

    const details = [
      product.size ? `tamanho ${product.size}` : null,
      product.brand,
    ]
      .filter(Boolean)
      .join(", ");

    const title = `${product.title} | MIF BRECHO`;
    const description = `${product.title}${details ? ` (${details})` : ""} por ${price}. Peça única do brechó MIF BRECHO, de Campo Grande - MS.`;

    const previousImages = (await parent).openGraph?.images ?? [];

    return {
      title,
      description,
      alternates: { canonical: `/produtos/${id}` },
      openGraph: {
        title,
        description,
        url: `/produtos/${id}`,
        siteName: "MIF BRECHO",
        locale: "pt_BR",
        type: "website",
        images: images[0] ? [{ url: images[0].url }] : previousImages,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (err) {
    console.error("Metadata da peça:", err);
    return {};
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
