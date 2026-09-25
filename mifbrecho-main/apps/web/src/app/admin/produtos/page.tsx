"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Category = {
  id: string;
  name: string;
};

type ProductImage = {
  id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
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
  images?: ProductImage[];
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

const MAX_PHOTOS = 8;
const MAX_PHOTO_MB = 5;

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  available: { label: "À venda", className: "bg-green-100 text-green-700" },
  hidden: { label: "Oculto", className: "bg-gray-100 text-gray-600" },
  sold: { label: "Vendida", className: "bg-red-100 text-red-700" },
  reserved: { label: "Reservada", className: "bg-amber-100 text-amber-700" },
};

/**
 * Decide o status da peça ao salvar, SEM tirar do oculto por engano:
 * - sem estoque → vendida (a não ser que esteja oculta)
 * - com estoque → volta a ficar à venda só se estava vendida
 * - oculta/reservada continua como está
 */
function nextStatus(current: string | undefined, stock: number): string {
  if (!current) return stock > 0 ? "available" : "sold";
  if (current === "hidden") return "hidden";
  if (stock <= 0) return "sold";
  if (current === "sold") return "available";
  return current;
}

/** Caminho do arquivo no Storage a partir do link público da foto */
function storagePathFromUrl(url: string): string | null {
  const marker = "/product-images/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

function sortImages(images: ProductImage[] = []): ProductImage[] {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

export default function AdminProductsPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  // fotos que já estão salvas (ao editar) e fotos novas escolhidas agora
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [imageBusy, setImageBusy] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previews = useMemo(
    () => newFiles.map((file) => URL.createObjectURL(file)),
    [newFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*, images:product_images(*)")
        .order("created_at", { ascending: false }),

      supabase.from("categories").select("id, name").order("name"),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
    } else {
      setProducts((productsResult.data || []) as Product[]);
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
    setExistingImages([]);
    setNewFiles([]);
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

    setExistingImages(sortImages(product.images));
    setNewFiles([]);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving || imageBusy) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setExistingImages([]);
    setNewFiles([]);
    setMessage("");
    setError("");
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // ---------------------------------------------------------------- fotos

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    setError("");

    const accepted: File[] = [];

    for (const file of Array.from(fileList)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`"${file.name}" não é JPG, PNG ou WEBP.`);
        continue;
      }

      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setError(`"${file.name}" tem mais de ${MAX_PHOTO_MB} MB.`);
        continue;
      }

      accepted.push(file);
    }

    setNewFiles((current) => {
      const room = MAX_PHOTOS - existingImages.length - current.length;

      if (accepted.length > room) {
        setError(`Máximo de ${MAX_PHOTOS} fotos por peça.`);
      }

      return [...current, ...accepted.slice(0, Math.max(room, 0))];
    });
  }

  function removeNewFile(index: number) {
    setNewFiles((current) => current.filter((_, i) => i !== index));
  }

  async function makePrimary(image: ProductImage) {
    if (!editingId || imageBusy) return;

    setImageBusy(true);
    setError("");

    const clearResult = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", editingId);

    if (clearResult.error) {
      setError(clearResult.error.message);
      setImageBusy(false);
      return;
    }

    const setResult = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", image.id);

    if (setResult.error) {
      setError(setResult.error.message);
      setImageBusy(false);
      return;
    }

    setExistingImages((current) =>
      sortImages(current.map((i) => ({ ...i, is_primary: i.id === image.id })))
    );

    setImageBusy(false);
    loadData();
  }

  async function removeImage(image: ProductImage) {
    if (!editingId || imageBusy) return;

    const confirmed = window.confirm("Remover esta foto da peça?");
    if (!confirmed) return;

    setImageBusy(true);
    setError("");

    const deleteResult = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteResult.error) {
      setError(deleteResult.error.message);
      setImageBusy(false);
      return;
    }

    // apaga também o arquivo (se não der certo, a peça continua funcionando)
    const path = storagePathFromUrl(image.url);

    if (path) {
      await supabase.storage.from("product-images").remove([path]);
    }

    let remaining = existingImages.filter((i) => i.id !== image.id);

    // se removeu a principal, a próxima vira principal
    if (image.is_primary && remaining.length > 0) {
      const first = sortImages(remaining)[0];

      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", first.id);

      remaining = remaining.map((i) => ({
        ...i,
        is_primary: i.id === first.id,
      }));
    }

    setExistingImages(sortImages(remaining));
    setImageBusy(false);
    loadData();
  }

  async function uploadNewImages(productId: string, alreadySaved: ProductImage[]) {
    if (newFiles.length === 0) return;

    let nextOrder =
      alreadySaved.length > 0
        ? Math.max(...alreadySaved.map((i) => i.sort_order)) + 1
        : 0;

    let hasPrimary = alreadySaved.some((i) => i.is_primary);

    const EXTENSION_BY_MIME: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    for (let index = 0; index < newFiles.length; index++) {
      const file = newFiles[index];

      // extensão vem do tipo do arquivo (já validado em addFiles), nunca do
      // nome que o navegador manda — evita salvar arquivo com extensão falsa
      const extension = EXTENSION_BY_MIME[file.type] || "jpg";
      const filePath = `products/${productId}-${Date.now()}-${index}.${extension}`;

      const uploadResult = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        throw new Error(
          `Não foi possível enviar "${file.name}": ${uploadResult.error.message}`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      /*
       * A tabela product_images usa a coluna `url`.
       * NÃO usar `image_path` aqui.
       */
      const imageResult = await supabase.from("product_images").insert({
        product_id: productId,
        url: publicUrlData.publicUrl,
        sort_order: nextOrder,
        is_primary: !hasPrimary,
      });

      if (imageResult.error) {
        throw new Error(imageResult.error.message);
      }

      hasPrimary = true;
      nextOrder += 1;
    }
  }

  // ---------------------------------------------------------------- salvar

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

      const currentStatus = editingId
        ? products.find((p) => p.id === editingId)?.status
        : undefined;

      const productData = {
        title: form.title.trim(),
        price: Math.round(numericPrice * 100),
        size: form.size.trim() || null,
        brand: form.brand.trim() || null,
        condition: form.condition.trim() || null,
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        stock: numericStock,
        status: nextStatus(currentStatus, numericStock),
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

      if (productId) {
        await uploadNewImages(productId, existingImages);
      }

      setMessage(
        editingId
          ? "Produto atualizado com sucesso!"
          : "Produto salvo com sucesso!"
      );

      setForm(emptyForm);
      setNewFiles([]);
      setExistingImages([]);
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
      // se algumas fotos subiram antes do erro, atualiza a lista
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------- lista

  async function toggleProduct(product: Product) {
    setError("");
    setMessage("");

    if (product.status !== "available" && product.stock < 1) {
      setError(
        "Esta peça está sem estoque. Clique em Editar e aumente o estoque para colocá-la à venda."
      );
      return;
    }

    const newStatus = product.status === "available" ? "hidden" : "available";

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

    const paths = (product.images ?? [])
      .map((image) => storagePathFromUrl(image.url))
      .filter((path): path is string => Boolean(path));

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      if (deleteError.code === "23503") {
        setError(
          "Esta peça já está em algum pedido e não pode ser excluída. Use Ocultar para tirá-la da loja."
        );
      } else {
        setError(deleteError.message);
      }
      return;
    }

    if (paths.length > 0) {
      await supabase.storage.from("product-images").remove(paths);
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

  const totalPhotos = existingImages.length + newFiles.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {!showForm && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>

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
              disabled={saving || imageBusy}
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
                onChange={(e) => updateField("title", e.target.value)}
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
                  onChange={(e) => updateField("price", e.target.value)}
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
                  onChange={(e) => updateField("stock", e.target.value)}
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
                  onChange={(e) => updateField("size", e.target.value)}
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
                  onChange={(e) => updateField("brand", e.target.value)}
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
                  onChange={(e) => updateField("condition", e.target.value)}
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
                  onChange={(e) => updateField("category_id", e.target.value)}
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
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Descreva a peça, estado de conservação, detalhes..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {/* ------------------------------------------------ Fotos */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Fotos da peça ({totalPhotos}/{MAX_PHOTOS})
              </label>

              {(existingImages.length > 0 || newFiles.length > 0) && (
                <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {existingImages.map((image) => (
                    <div
                      key={image.id}
                      className="rounded-xl border border-gray-200 p-1.5"
                    >
                      <div className="relative">
                        <img
                          src={image.url}
                          alt="Foto da peça"
                          className="aspect-[3/4] w-full rounded-lg object-cover"
                        />

                        {image.is_primary && (
                          <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-col gap-1">
                        {!image.is_primary && (
                          <button
                            type="button"
                            onClick={() => makePrimary(image)}
                            disabled={imageBusy}
                            className="rounded-md border border-gray-200 px-1 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Tornar principal
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          disabled={imageBusy}
                          className="rounded-md border border-red-200 px-1 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  {newFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-xl border border-dashed border-primary p-1.5"
                    >
                      <div className="relative">
                        <img
                          src={previews[index]}
                          alt="Foto nova"
                          className="aspect-[3/4] w-full rounded-lg object-cover"
                        />

                        <span className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Nova
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="mt-1.5 w-full rounded-md border border-gray-200 px-1 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Tirar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={totalPhotos >= MAX_PHOTOS}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG ou WEBP, até {MAX_PHOTO_MB} MB cada. Você pode escolher
                várias fotos. A foto principal aparece no catálogo.
                {editingId
                  ? " Para trocar uma foto, adicione a nova e remova a antiga."
                  : ""}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving || imageBusy}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || imageBusy}
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
              {products.map((product) => {
                const status =
                  STATUS_LABEL[product.status] ?? STATUS_LABEL.hidden;
                const cover = sortImages(product.images)[0]?.url;

                return (
                  <article
                    key={product.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {cover ? (
                          <img
                            src={cover}
                            alt={product.title}
                            className="h-24 w-[72px] flex-shrink-0 rounded-lg bg-secondary object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-[72px] flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-xs text-gray-400">
                            Sem foto
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {product.title}
                            </h3>

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <p className="text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {getCategoryName(product.category_id)}
                            {product.size ? ` • Tamanho ${product.size}` : ""}
                            {product.brand ? ` • ${product.brand}` : ""}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Estoque: {product.stock} •{" "}
                            {(product.images ?? []).length}{" "}
                            {(product.images ?? []).length === 1
                              ? "foto"
                              : "fotos"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </button>

                        {product.status !== "sold" && (
                          <button
                            type="button"
                            onClick={() => toggleProduct(product)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {product.status === "available"
                              ? "Ocultar"
                              : "Mostrar"}
                          </button>
                        )}

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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
