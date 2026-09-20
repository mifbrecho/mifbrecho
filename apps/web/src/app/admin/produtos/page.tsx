```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ImagePlus,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  size: string | null;
  brand: string | null;
  condition: string;
  category_id: string | null;
  status: string;
  stock: number;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  title: "",
  price: "",
  size: "",
  brand: "",
  condition: "Seminovo",
  category_id: "",
  description: "",
  stock: "1",
};

export default function AdminProdutosPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("id, name")
        .order("name"),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
    } else {
      setProducts(productsResult.data || []);
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setShowForm(false);
    setMessage("");
    setError("");
  }

  function handleImageChange(file: File | null) {
    setImageFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview("");
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      title: product.title,
      price: (product.price / 100).toFixed(2).replace(".", ","),
      size: product.size || "",
      brand: product.brand || "",
      condition: product.condition || "Seminovo",
      category_id: product.category_id || "",
      description: product.description || "",
      stock: String(product.stock ?? 1),
    });

    setImageFile(null);
    setImagePreview("");
    setMessage("");
    setError("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(productId: string) {
    if (!imageFile) return;

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${productId}-${Date.now()}.${extension}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao enviar foto: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    /*
      A tabela product_images do projeto usa:
      product_id + image_path + sort_order
    */
    const { error: imageError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_path: publicUrl,
        sort_order: 0,
      });

    if (imageError) {
      throw new Error(
        `Produto salvo, mas não foi possível registrar a foto: ${imageError.message}`
      );
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const priceNumber = Number(
        form.price.replace(/\./g, "").replace(",", ".")
      );

      const stockNumber = Number(form.stock);

      if (!form.title.trim()) {
        throw new Error("Digite o nome da peça.");
      }

      if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
        throw new Error("Digite um preço válido.");
      }

      if (!Number.isInteger(stockNumber) || stockNumber < 0) {
        throw new Error("Digite um estoque válido.");
      }

      const productData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: Math.round(priceNumber * 100),
        size: form.size.trim() || null,
        brand: form.brand.trim() || null,
        condition: form.condition,
        category_id: form.category_id || null,
        stock: stockNumber,
        status: stockNumber > 0 ? "available" : "hidden",
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        if (imageFile) {
          await uploadImage(editingId);
        }

        setMessage("Peça atualizada com sucesso! 💕");
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        if (imageFile && newProduct) {
          await uploadImage(newProduct.id);
        }

        setMessage("Peça cadastrada com sucesso! 💕");
      }

      await loadData();

      setForm(emptyForm);
      setEditingId(null);
      setImageFile(null);
      setImagePreview("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar a peça."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product: Product) {
    setActionId(product.id);
    setError("");

    const newStatus =
      product.status === "available" ? "hidden" : "available";

    const { error: updateError } = await supabase
      .from("products")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    }

    setActionId(null);
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Excluir "${product.title}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) return;

    setActionId(product.id);
    setError("");

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setProducts((prev) =>
        prev.filter((item) => item.id !== product.id)
      );
      setMessage("Peça excluída com sucesso.");
    }

    setActionId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-white/80 text-sm">
            ← Voltar
          </Link>

          <h1 className="font-bold">Produtos</h1>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setMessage("");
              setError("");
            }
          }}
          className="bg-white text-primary text-sm font-semibold px-4 py-2 rounded-full"
        >
          {showForm ? "Cancelar" : "+ Nova peça"}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {message && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-primary-light p-5 mb-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text">
                {editingId ? "Editar peça" : "Cadastrar nova peça"}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="text-text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Nome da peça *
              </label>

              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Ex: Vestido floral midi"
                className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Preço *
                </label>

                <input
                  required
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="79,90"
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Estoque *
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Tamanho
                </label>

                <input
                  value={form.size}
                  onChange={(e) =>
                    setForm({ ...form, size: e.target.value })
                  }
                  placeholder="P, M, G, 38..."
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Marca
                </label>

                <input
                  value={form.brand}
                  onChange={(e) =>
                    setForm({ ...form, brand: e.target.value })
                  }
                  placeholder="Ex: Zara"
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Condição
                </label>

                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value })
                  }
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                >
                  <option>Novo</option>
                  <option>Seminovo</option>
                  <option>Usado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Categoria
                </label>

                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Selecione...</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Foto da peça
              </label>

              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-light bg-[#fffaf7] overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Prévia da peça"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <>
                    <ImagePlus
                      size={34}
                      className="mb-2 text-primary"
                    />

                    <span className="text-sm font-medium text-text">
                      Clique para escolher uma foto
                    </span>

                    <span className="mt-1 text-xs text-text-muted">
                      JPG, PNG ou WEBP
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    handleImageChange(e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Descrição
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Descreva a peça, estado de conservação, detalhes..."
                rows={4}
                className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white font-semibold py-3 rounded-full disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && (
                <Loader2 size={18} className="animate-spin" />
              )}

              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Cadastrar peça"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              size={30}
              className="animate-spin text-primary"
            />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-primary-light bg-white p-8 text-center">
            <p className="font-semibold text-text">
              Nenhuma peça cadastrada.
            </p>

            <p className="text-sm text-text-muted mt-1">
              Clique em “+ Nova peça” para cadastrar a primeira.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const busy = actionId === product.id;
              const available = product.status === "available";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-primary-light p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-text text-sm truncate">
                        {product.title}
                      </p>

                      <p className="text-primary font-bold text-sm mt-1">
                        {formatPrice(product.price)}
                      </p>

                      <p className="text-xs text-text-muted mt-1">
                        {product.size || "Sem tamanho"}
                        {" · "}
                        {product.brand || "Sem marca"}
                        {" · "}
                        estoque: {product.stock}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          available
                            ? "text-success"
                            : "text-text-muted"
                        }`}
                      >
                        {available ? "● Disponível" : "● Oculta"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        disabled={busy}
                        title="Editar"
                        className="h-9 w-9 rounded-full border border-primary-light flex items-center justify-center text-primary hover:bg-[#fff7f2] disabled:opacity-50"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(product)}
                        disabled={busy}
                        title={available ? "Ocultar" : "Mostrar"}
                        className="h-9 w-9 rounded-full border border-primary-light flex items-center justify-center text-primary hover:bg-[#fff7f2] disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : available ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        disabled={busy}
                        title="Excluir"
                        className="h-9 w-9 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
```
