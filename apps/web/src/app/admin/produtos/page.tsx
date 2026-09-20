"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

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
  condition: string | null;
  category_id: string | null;
  status: string;
  stock: number;
  created_at: string;
};

type FormData = {
  title: string;
  price: string;
  size: string;
  brand: string;
  condition: string;
  category_id: string;
  description: string;
  stock: string;
};

const emptyForm: FormData = {
  title: "",
  price: "",
  size: "",
  brand: "",
  condition: "Usado",
  category_id: "",
  description: "",
  stock: "1",
};

export default function AdminProductsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

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

    if (categoriesResult.error) {
      setError(categoriesResult.error.message);
    } else {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  }

  function openNewProduct() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      title: product.title || "",
      price: String((product.price || 0) / 100),
      size: product.size || "",
      brand: product.brand || "",
      condition: product.condition || "Usado",
      category_id: product.category_id || "",
      description: product.description || "",
      stock: String(product.stock ?? 1),
    });

    setImageFile(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setMessage("");
    setError("");
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(productId: string) {
    if (!imageFile) return null;

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${productId}-${Date.now()}.${extension}`;
    const filePath = `products/${fileName}`;

    const uploadResult = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    /*
     * A tabela product_images usa a coluna `url`.
     * NÃO usar `image_path` aqui.
     */
    const imageResult = await supabase.from("product_images").insert({
      product_id: productId,
      url: publicUrl,
      sort_order: 0,
      is_primary: true,
    });

    if (imageResult.error) {
      throw new Error(imageResult.error.message);
    }

    return publicUrl;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!form.title.trim()) {
        throw new Error("Digite o nome da peça.");
      }

      const numericPrice = Number(
        form.price.replace(",", ".").replace(/[^\d.]/g, "")
      );

      if (!numericPrice || numericPrice <= 0) {
        throw new Error("Digite um preço válido.");
      }

      const numericStock = Number(form.stock);

      if (numericStock < 0 || !Number.isInteger(numericStock)) {
        throw new Error("Digite um estoque válido.");
      }

      const productData = {
        title: form.title.trim(),
        price: Math.round(numericPrice * 100),
        size: form.size.trim() || null,
        brand: form.brand.trim() || null,
        condition: form.condition.trim() || null,
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        stock: numericStock,
        status: numericStock > 0 ? "available" : "sold",
      };

      let productId = editingId;

      if (editingId) {
        const updateResult = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (updateResult.error) {
          throw new Error(updateResult.error.message);
        }

        productId = editingId;
      } else {
        const insertResult = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (insertResult.error) {
          throw new Error(insertResult.error.message);
        }

        productId = insertResult.data.id;
      }

      if (imageFile && productId) {
        await uploadImage(productId);
      }

      setMessage(
        editingId
          ? "Produto atualizado com sucesso!"
          : "Produto salvo com sucesso!"
      );

      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);

      await loadData();

      setTimeout(() => {
        setShowForm(false);
        setMessage("");
      }, 1200);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocorreu um erro.";

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product) {
    setError("");
    setMessage("");

    const newStatus =
      product.status === "available" ? "hidden" : "available";

    const { error: updateError } = await supabase
      .from("products")
      .update({
        status: newStatus,
      })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      newStatus === "available"
        ? "Produto colocado à venda."
        : "Produto ocultado."
    );

    await loadData();
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Excluir "${product.title}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("Produto excluído com sucesso.");
    await loadData();
  }

  function formatPrice(value: number) {
    return (value / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return "Sem categoria";

    return (
      categories.find((category) => category.id === categoryId)?.name ||
      "Sem categoria"
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">MIF BRECHO</h1>
            <p className="text-sm text-white/80">Gerenciar produtos</p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            Voltar
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {!showForm && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Produtos
              </h2>

              <p className="text-sm text-gray-500">
                Cadastre e gerencie as peças da loja.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewProduct}
              className="rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-sm hover:opacity-90"
            >
              + Nova peça
            </button>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Editar peça" : "Nova peça"}
                </h2>

                <p className="text-sm text-gray-500">
                  Preencha os dados da peça.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome da peça *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  placeholder="Ex.: Vestido preto midi"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preço *
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) =>
                      updateField("price", e.target.value)
                    }
                    placeholder="Ex.: 59,90"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Estoque *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) =>
                      updateField("stock", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tamanho
                  </label>

                  <input
                    type="text"
                    value={form.size}
                    onChange={(e) =>
                      updateField("size", e.target.value)
                    }
                    placeholder="Ex.: M"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Marca
                  </label>

                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      updateField("brand", e.target.value)
                    }
                    placeholder="Ex.: Zara"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Condição
                  </label>

                  <select
                    value={form.condition}
                    onChange={(e) =>
                      updateField("condition", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Seminovo">Seminovo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Categoria
                  </label>

                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      updateField("category_id", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="">Selecione uma categoria</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descrição
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Descreva a peça, estado de conservação, detalhes..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Foto da peça
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                />

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG ou WEBP.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                    ? "Salvar alterações"
                    : "Cadastrar peça"}
                </button>
              </div>
            </form>
          </section>
        )}

        {!showForm && (
          <>
            {loading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
                Carregando produtos...
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="font-medium text-gray-800">
                  Nenhum produto cadastrado.
                </p>

                <button
                  type="button"
                  onClick={openNewProduct}
                  className="mt-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white"
                >
                  + Cadastrar primeira peça
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900">
                            {product.title}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              product.status === "available"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.status === "available"
                              ? "À venda"
                              : "Oculto"}
                          </span>
                        </div>

                        <p className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {getCategoryName(product.category_id)}
                          {product.size
                            ? ` • Tamanho ${product.size}`
                            : ""}
                          {product.brand
                            ? ` • ${product.brand}`
                            : ""}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Estoque: {product.stock}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProduct(product)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {product.status === "available"
                            ? "Ocultar"
                            : "Mostrar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
