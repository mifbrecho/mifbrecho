import type { Product, Category } from "@mifre/shared";

/**
 * Dados de exemplo para o app funcionar mesmo antes de conectar o Supabase.
 * Depois a gente troca pelos dados reais do banco.
 */

export const mockCategories: Category[] = [
  { id: "1", name: "Vestidos", slug: "vestidos", image_url: null, sort_order: 1 },
  { id: "2", name: "Blusas", slug: "blusas", image_url: null, sort_order: 2 },
  { id: "3", name: "Calças", slug: "calcas", image_url: null, sort_order: 3 },
  { id: "4", name: "Saias", slug: "saias", image_url: null, sort_order: 4 },
  { id: "5", name: "Acessórios", slug: "acessorios", image_url: null, sort_order: 5 },
];

export const mockProducts: Product[] = [
  {
    id: "p1",
    title: "Vestido Floral Rosa",
    description: "Vestido leve, estampa floral delicada. Perfeito para o dia a dia. Tecido leve e confortável.",
    price: 7990, // R$ 79,90
    size: "M",
    brand: "Zara",
    condition: "Seminovo",
    category_id: "1",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img1",
        product_id: "p1",
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: "p2",
    title: "Blusa Branca Babados",
    description: "Blusa romântica com babados. Combina com qualquer look.",
    price: 4990,
    size: "P",
    brand: "Renner",
    condition: "Seminovo",
    category_id: "2",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img2",
        product_id: "p2",
        url: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: "p3",
    title: "Calça Jeans Wide Leg",
    description: "Calça jeans wide leg, cintura alta. Super em alta!",
    price: 8990,
    size: "38",
    brand: "C&A",
    condition: "Seminovo",
    category_id: "3",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img3",
        product_id: "p3",
        url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: "p4",
    title: "Saia Midi Plissada",
    description: "Saia midi plissada na cor nude. Elegante e versátil.",
    price: 5990,
    size: "M",
    brand: "Marisa",
    condition: "Novo",
    category_id: "4",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img4",
        product_id: "p4",
        url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: "p5",
    title: "Bolsa Tiracolo Rosa",
    description: "Bolsa pequena tiracolo, cor rosa chiclete. Fofa demais!",
    price: 3990,
    size: "Único",
    brand: "Shein",
    condition: "Seminovo",
    category_id: "5",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img5",
        product_id: "p5",
        url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: "p6",
    title: "Vestido Longo Preto",
    description: "Vestido longo preto, alças finas. Ideal para ocasiões especiais.",
    price: 11990,
    size: "G",
    brand: "Farm",
    condition: "Seminovo",
    category_id: "1",
    status: "available",
    stock: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "img6",
        product_id: "p6",
        url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop",
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
];
