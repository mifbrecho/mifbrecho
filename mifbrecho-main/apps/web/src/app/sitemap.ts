import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
 
// Atualiza a lista a cada 1 hora
export const revalidate = 3600;
 
const SITE = "https://www.mifbrecho.com.br";
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
 
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/produtos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/categorias`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/sobre`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/entrega`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/trocas`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
 
  // Cada peça à venda também entra na lista
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
 
    const { data, error } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(1000);
 
    if (error) {
      console.error("Sitemap: erro ao buscar peças:", error.message);
      return pages;
    }
 
    const products: MetadataRoute.Sitemap = (data ?? []).map(
      (product: { id: string; updated_at: string | null }) => ({
        url: `${SITE}/produtos/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })
    );
 
    return [...pages, ...products];
  } catch (err) {
    console.error("Sitemap: erro inesperado:", err);
    return pages;
  }
}
