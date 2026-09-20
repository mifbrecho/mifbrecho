"use client";
 
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
 
type ToggleResult = "added" | "removed" | "login" | "error";
 
interface FavoritesState {
  ids: string[];
  loaded: boolean;
  isLoggedIn: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<ToggleResult>;
}
 
// Evita várias buscas iguais quando muitos cards pedem os favoritos ao mesmo tempo
let loadPromise: Promise<void> | null = null;
 
/**
 * Favoritos guardados no Supabase (tabela "favorites"), por usuária.
 * Visitante (sem login) não tem favoritos: o toggle devolve "login".
 */
export const useFavorites = create<FavoritesState>()((set, get) => ({
  ids: [],
  loaded: false,
  isLoggedIn: false,
 
  load: () => {
    if (get().loaded) return Promise.resolve();
 
    if (!loadPromise) {
      loadPromise = (async () => {
        const supabase = createClient();
 
        const {
          data: { user },
        } = await supabase.auth.getUser();
 
        if (!user) {
          set({ ids: [], loaded: true, isLoggedIn: false });
          return;
        }
 
        const { data, error } = await supabase
          .from("favorites")
          .select("product_id");
 
        if (error) {
          console.error("Erro ao carregar favoritos:", error);
          set({ ids: [], loaded: true, isLoggedIn: true });
          return;
        }
 
        set({
          ids: (data ?? []).map((row: { product_id: string }) => row.product_id),
          loaded: true,
          isLoggedIn: true,
        });
      })().finally(() => {
        loadPromise = null;
      });
    }
 
    return loadPromise;
  },
 
  toggle: async (productId) => {
    const supabase = createClient();
 
    const {
      data: { user },
    } = await supabase.auth.getUser();
 
    if (!user) {
      set({ ids: [], loaded: true, isLoggedIn: false });
      return "login";
    }
 
    const wasFavorite = get().ids.includes(productId);
 
    // Atualiza o coração na hora; se o banco falhar, volta atrás
    set((state) => ({
      isLoggedIn: true,
      ids: wasFavorite
        ? state.ids.filter((id) => id !== productId)
        : [...state.ids, productId],
    }));
 
    const { error } = wasFavorite
      ? await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
      : await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
 
    // 23505 = já estava favoritado (clique duplo): tudo certo
    if (error && error.code !== "23505") {
      console.error("Erro ao salvar favorito:", error);
 
      set((state) => ({
        ids: wasFavorite
          ? [...state.ids, productId]
          : state.ids.filter((id) => id !== productId),
      }));
 
      return "error";
    }
 
    return wasFavorite ? "removed" : "added";
  },
}));
