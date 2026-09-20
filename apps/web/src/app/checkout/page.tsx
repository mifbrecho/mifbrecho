"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clear } = useCart();
  const total = totalAmount();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "SP",
    zip: "",
  });

  const [step, setStep] = useState<"form" | "pix">("form");
  const [pixCode, setPixCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (items.length === 0 && step === "form") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <p className="text-text-muted mb-4">Seu carrinho está vazio</p>
          <button
            onClick={() => router.push("/produtos")}
            className="text-primary font-medium"
          >
            Ver peças
          </button>
        </div>
      </div>
    );
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Simula geração de Pix (depois conecta com a API real do Mercado Pago)
    // Por enquanto gera um código de exemplo
    await new Promise((r) => setTimeout(r, 1200));

    const fakePix =
      "00020126580014br.gov.bcb.pix0136" +
      Math.random().toString(36).slice(2) +
      "520400005303986540" +
      (total / 100).toFixed(2) +
      "5802BR5913MIF BRECHO6009SAO PAULO62070503***6304ABCD";

    setPixCode(fakePix);
    setStep("pix");
    setLoading(false);
  }

  function copyPix() {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function confirmPayment() {
    // Aqui depois a gente confirma via webhook real.
    // Por enquanto: limpa o carrinho e mostra sucesso.
    clear();
    alert(
      "Pedido registrado! 💕\n\nAssim que o Pix for confirmado, sua irmã verá o pedido no painel e a peça sairá do estoque automaticamente."
    );
    router.push("/");
  }

  if (step === "pix") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-md mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-primary-light p-6 shadow-sm text-center">
            <h1 className="text-xl font-bold text-text mb-2">Pague com Pix</h1>
            <p className="text-sm text-text-muted mb-6">
              Valor: <span className="font-bold text-primary">{formatPrice(total)}</span>
            </p>

            {/* QR Code placeholder */}
            <div className="w-48 h-48 mx-auto bg-secondary rounded-xl flex items-center justify-center mb-6 border-2 border-dashed border-primary-light">
              <p className="text-xs text-text-muted px-4 text-center">
                QR Code do Pix
                <br />
                (aparece quando conectar o Mercado Pago)
              </p>
            </div>

            <p className="text-xs text-text-muted mb-2">
              Ou copie o código Pix:
            </p>
            <div className="bg-secondary rounded-xl p-3 text-left mb-4">
              <p className="text-xs break-all text-text font-mono">{pixCode}</p>
            </div>

            <button
              onClick={copyPix}
              className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-full mb-3 hover:bg-primary/5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar código Pix
                </>
              )}
            </button>

            <button
              onClick={confirmPayment}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-full hover:bg-primary-dark"
            >
              Já paguei
            </button>

            <p className="text-xs text-text-muted mt-4">
              Após o pagamento, a peça sai do estoque automaticamente e sua irmã
              recebe o pedido no painel.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text mb-6">Finalizar compra</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-primary-light p-5 space-y-4">
            <h2 className="font-semibold text-text">Seus dados</h2>

            <input
              name="name"
              placeholder="Nome completo"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              name="phone"
              placeholder="WhatsApp (com DDD)"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="bg-white rounded-2xl border border-primary-light p-5 space-y-4">
            <h2 className="font-semibold text-text">Endereço de entrega</h2>

            <div className="grid grid-cols-3 gap-3">
              <input
                name="zip"
                placeholder="CEP"
                required
                value={form.zip}
                onChange={handleChange}
                className="col-span-1 border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                name="street"
                placeholder="Rua"
                required
                value={form.street}
                onChange={handleChange}
                className="col-span-2 border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                name="number"
                placeholder="Número"
                required
                value={form.number}
                onChange={handleChange}
                className="border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                name="complement"
                placeholder="Complemento"
                value={form.complement}
                onChange={handleChange}
                className="col-span-2 border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <input
              name="neighborhood"
              placeholder="Bairro"
              required
              value={form.neighborhood}
              onChange={handleChange}
              className="w-full border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                name="city"
                placeholder="Cidade"
                required
                value={form.city}
                onChange={handleChange}
                className="col-span-2 border border-primary-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="border border-primary-light rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {["SP", "RJ", "MG", "PR", "SC", "RS", "BA", "PE", "CE", "GO", "DF", "ES", "Outro"].map(
                  (uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-primary-light p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-text">Total a pagar</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Pagamento somente via Pix. Seguro e sem cartão.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-4 rounded-full hover:bg-primary-dark transition disabled:opacity-60 shadow-lg shadow-primary/25"
            >
              {loading ? "Gerando Pix..." : "Gerar Pix"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
