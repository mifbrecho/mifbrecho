import type { OrderStatus } from "@mifre/shared";
 
/** Nome, cor e mensagem de cada status do pedido */
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; badge: string; hint: string }
> = {
  pending_payment: {
    label: "Aguardando Pix",
    badge: "bg-amber-100 text-amber-800",
    hint: "Assim que o Pix for confirmado, seu pedido segue para separação.",
  },
  paid: {
    label: "Pago",
    badge: "bg-green-100 text-green-800",
    hint: "Recebemos o pagamento! Vamos separar suas peças.",
  },
  preparing: {
    label: "Em separação",
    badge: "bg-blue-100 text-blue-800",
    hint: "Estamos separando e embalando suas peças com carinho.",
  },
  shipped: {
    label: "Enviado",
    badge: "bg-purple-100 text-purple-800",
    hint: "Seu pedido saiu para entrega.",
  },
  delivered: {
    label: "Entregue",
    badge: "bg-green-100 text-green-800",
    hint: "Pedido entregue. Obrigada pela compra! 💕",
  },
  cancelled: {
    label: "Cancelado",
    badge: "bg-red-100 text-red-800",
    hint: "Este pedido foi cancelado.",
  },
};
 
/** Etapas mostradas na linha do tempo (pedido cancelado não usa) */
export const ORDER_STEPS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "delivered",
];
 
export function statusInfo(status: string) {
  return (
    ORDER_STATUS[status as OrderStatus] ?? {
      label: status,
      badge: "bg-gray-100 text-gray-700",
      hint: "",
    }
  );
}
 
/** Número curto do pedido, ex.: A1B2C3D4 */
export function orderNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
 
export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
 
export interface OrderItemImage {
  url: string;
  is_primary: boolean;
  sort_order: number;
}
 
export interface OrderItemProduct {
  id: string;
  title: string;
  size: string | null;
  brand?: string | null;
  images?: OrderItemImage[];
}
 
export interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number; // centavos
  product: OrderItemProduct | null;
}
 
export interface OrderRow {
  id: string;
  status: string;
  total_amount: number; // centavos
  created_at: string;
  pix_copy_paste?: string | null;
  notes?: string | null;
  shipping_street?: string | null;
  shipping_number?: string | null;
  shipping_complement?: string | null;
  shipping_neighborhood?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip_code?: string | null;
  shipping_reference?: string | null;
  items: OrderItemRow[];
}
 
const PRODUCT_FIELDS =
  "id, title, size, brand, images:product_images(url, is_primary, sort_order)";
 
/** Lista de pedidos (resumo) */
export const ORDER_LIST_SELECT = `id, status, total_amount, created_at, items:order_items(id, quantity, unit_price, product:products(${PRODUCT_FIELDS}))`;
 
/** Um pedido completo */
export const ORDER_DETAIL_SELECT = `*, items:order_items(id, quantity, unit_price, product:products(${PRODUCT_FIELDS}))`;
 
export const PLACEHOLDER_IMAGE =
  "https://placehold.co/200x250/FCE4EC/E91E63?text=MIF+BRECHO";
 
/** Foto principal da peça (ou uma imagem padrão) */
export function itemImageUrl(product: OrderItemProduct | null): string {
  const images = [...(product?.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
 
  return images[0]?.url || PLACEHOLDER_IMAGE;
}
