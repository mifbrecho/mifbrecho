"use client";

import { useState } from "react";
import Link from "next/link";
import { mockProducts } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@mifre/shared";

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    size: "",
    brand: "",
    condition: "Seminovo",
    description: "",
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(form.price.replace(",", ".")) * 100);

    const newProduct: Product = {
      id: "p" + Date.now(),
      title: form.title,
      description: form.description || null,
      price: priceCents,
      size: form.size || null,
      brand: form.brand || null,
      condition: form.condition,
      category_id: null,
      status: "available",
      stock: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    };

    setProducts((prev) => [newProduct, ...prev]);
    setForm({
      title: "",
      price: "",
      size: "",
      brand: "",
      condition: "Seminovo",
      description: "",
    });
    setShowForm(false);
    alert("Peça cadastrada! 💕\n(Quando conectar o banco, ela fica salva de verdade)");
  }

  function toggleStatus(id: string) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: p.status === "available" ? "hidden" : "available",
            }
          : p
      )
    );
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
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-primary text-sm font-semibold px-4 py-2 rounded-full"
        >
          {showForm ? "Cancelar" : "+ Nova peça"}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl border border-primary-light p-5 mb-6 space-y-3"
          >
            <h2 className="font-semibold text-text mb-2">Cadastrar nova peça</h2>
            <input
              required
              placeholder="Nome da peça *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Preço (ex: 79,90) *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-primary-light rounded-xl px-4 py-3 text-sm"
              />
              <input
                placeholder="Tamanho"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="border border-primary-light rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Marca"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="border border-primary-light rounded-xl px-4 py-3 text-sm"
              />
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="border border-primary-light rounded-xl px-4 py-3 text-sm"
              >
                <option>Novo</option>
                <option>Seminovo</option>
                <option>Usado</option>
              </select>
            </div>
            <textarea
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm"
            />
            <p className="text-xs text-text-muted">
              Foto: depois conectamos o upload. Por enquanto a peça aparece sem foto.
            </p>
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-3 rounded-full"
            >
              Salvar peça
            </button>
          </form>
        )}

        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-primary-light p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-text text-sm truncate">{p.title}</p>
                <p className="text-primary font-bold text-sm">
                  {formatPrice(p.price)}
                  {p.size && (
                    <span className="text-text-muted font-normal ml-2">
                      · {p.size}
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5">
                  <span
                    className={
                      p.status === "available"
                        ? "text-success"
                        : "text-text-muted"
                    }
                  >
                    {p.status === "available" ? "Disponível" : "Oculta"}
                  </span>
                  {" · "}
                  estoque: {p.stock}
                </p>
              </div>
              <button
                onClick={() => toggleStatus(p.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-primary-light text-primary whitespace-nowrap"
              >
                {p.status === "available" ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
