"use client";
 
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem } from "@mifre/shared";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/products";
 
export type AddResult = "added" | "limit" | "soldout";
 
export interface CartRefreshResult {
  removed: string[]; // peças que não estão mais à venda
  adjusted: string[]; // quantidade reduzida para caber no estoque
  priceChanged: string[]; // peças que mudaram de preço
}
 
interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => AddResult;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalAmount: () => number; // centavos
  refresh: () => Promise<CartRefreshResult>;
}
 
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
 
      // Nunca deixa colocar mais unidades do que o estoque
      addItem: (product, quantity = 1) => {
        if (product.stock < 1) return "soldout";
 
        const existing = get().items.find((i) => i.product.id === product.id);
        const current = existing?.quantity ?? 0;
 
        if (current >= product.stock) return "limit";
 
        const next = Math.min(current + quantity, product.stock);
 
        set((state) => ({
          items: existing
            ? state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, product, quantity: next }
                  : i
              )
            : [...state.items, { product, quantity: next }],
        }));
 
        return "added";
      },
 
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },
 
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
 
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? {
                  ...i,
                  quantity: Math.min(quantity, Math.max(i.product.stock, 1)),
                }
              : i
          ),
        }));
      },
 
      clear: () => set({ items: [] }),
 
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
 
      totalAmount: () =>
        get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
 
      /**
       * Confere o carrinho com o Supabase:
       * - tira peças vendidas, ocultas, apagadas ou antigas (de exemplo)
       * - ajusta a quantidade ao estoque atual
       * - atualiza preço, nome e foto
       * Se não conseguir consultar o banco, não mexe em nada.
       */
      refresh: async () => {
        const result: CartRefreshResult = {
          removed: [],
          adjusted: [],
          priceChanged: [],
        };
 
        const requestedIds = get()
          .items.map((i) => i.product.id)
          .filter((id) => UUID_REGEX.test(id));
 
        if (get().items.length === 0) return result;
 
        let fresh: Product[] = [];
 
        if (requestedIds.length > 0) {
          const supabase = createClient();
 
          const { data, error } = await supabase
            .from("products")
            .select(PRODUCT_SELECT)
            .in("id", requestedIds);
 
          if (error) {
            console.error("Erro ao conferir o carrinho:", error);
            return result;
          }
 
          fresh = (data ?? []).map(normalizeProduct);
        }
 
        const freshById = new Map(fresh.map((p) => [p.id, p]));
        const requested = new Set(requestedIds);
        const nextItems: CartItem[] = [];
 
        for (const item of get().items) {
          // item adicionado enquanto a conferência rodava: mantém
          if (
            !requested.has(item.product.id) &&
            UUID_REGEX.test(item.product.id)
          ) {
            nextItems.push(item);
            continue;
          }
 
          const product = freshById.get(item.product.id);
 
          if (!product || product.status !== "available" || product.stock < 1) {
            result.removed.push(item.product.title);
            continue;
          }
 
          let quantity = item.quantity;
 
          if (quantity > product.stock) {
            quantity = product.stock;
            result.adjusted.push(product.title);
          }
 
          if (product.price !== item.product.price) {
            result.priceChanged.push(product.title);
          }
 
          nextItems.push({ product, quantity });
        }
 
        set({ items: nextItems });
 
        return result;
      },
    }),
    {
      name: "mifre-cart",
    }
  )
);
