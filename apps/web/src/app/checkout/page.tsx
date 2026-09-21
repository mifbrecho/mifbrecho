"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

type Delivery = "motoboy" | "pickup" | "correios";
type AuthState = "checking" | "guest" | "ready";

const DELIVERY_OPTIONS: { value: Delivery; title: string; desc: string }[] = [
  {
    value: "motoboy",
    title: "Entrega por motoboy",
    desc: "Somente em Campo Grande. O valor depende do endereço e é combinado pelo WhatsApp.",
  },
  {
    value: "pickup",
    title: "Retirar com a loja",
    desc: "Em Campo Grande. Combinamos o local e o horário pelo WhatsApp.",
  },
  {
    value: "correios",
    title: "Correios",
    desc: "Outras cidades de Mato Grosso do Sul. O frete é combinado pelo WhatsApp.",
  },
];

const emptyForm = {
  name: "",
  phone: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  reference: "",
};

const inputClass =
  "w-full rounded-xl border border-primary-light bg-white px-4 py-3 outline-none focus:border-primary";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatZip(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clear, refresh } = useCart();
  const total = totalAmount();

  const [auth, setAuth] = useState<AuthState>("checking");
  const [delivery, setDelivery] = useState<Delivery>("motoboy");
  const [form, setForm] = useState(emptyForm);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function start() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuth("guest");
        return;
      }

      // Já preenche nome e telefone, se a conta tiver
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      setForm((current) => ({
        ...current,
        name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
      }));

      setAuth("ready");

      // Tira do carrinho o que já não está mais à venda
      const result = await refresh();

      if (result.removed.length > 0) {
        setNotice(
          `Saiu do carrinho porque não está mais disponível: ${result.removed.join(", ")}.`
        );
      }
    }

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleZipChange(value: string) {
    const zip = formatZip(value);

    updateField("zip", zip);
    setCepError("");

    const digits = zip.replace(/\D/g, "");

    if (digits.length !== 8) return;

    setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado. Preencha o endereço abaixo.");
      } else {
        setForm((current) => ({
          ...current,
          street: data.logradouro || current.street,
          neighborhood: data.bairro || current.neighborhood,
          city: data.localidade || current.city,
          state: data.uf || current.state,
        }));
      }
    } catch {
      setCepError("Não foi possível buscar o CEP. Preencha o endereço abaixo.");
    }

    setCepLoading(false);
  }

  function validate(): string {
    if (form.name.trim().length < 2) return "Digite o seu nome.";

    if (form.phone.replace(/\D/g, "").length < 10) {
      return "Digite um telefone com DDD para combinarmos a entrega pelo WhatsApp.";
    }

    if (delivery === "pickup") return "";

    if (form.zip.replace(/\D/g, "").length !== 8) return "Digite o CEP.";

    if (
      !form.street.trim() ||
      !form.number.trim() ||
      !form.neighborhood.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      return "Preencha o endereço completo.";
    }

    if (form.state.trim().toUpperCase() !== "MS") {
      return "No momento entregamos somente em Mato Grosso do Sul.";
    }

    if (delivery === "motoboy" && normalize(form.city) !== "campo grande") {
      return "A entrega por motoboy é só em Campo Grande. Escolha Correios para outras cidades.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    const problem = validate();

    if (problem) {
      setError(problem);
      return;
    }

    if (items.length === 0) {
      setError("Seu carrinho está vazio.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc("create_order", {
      p_items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      p_delivery: delivery,
      p_name: form.name.trim(),
      p_phone: form.phone.trim(),
      p_zip: form.zip.trim(),
      p_street: form.street.trim(),
      p_number: form.number.trim(),
      p_complement: form.complement.trim(),
      p_neighborhood: form.neighborhood.trim(),
      p_city: form.city.trim(),
      p_state: form.state.trim(),
      p_reference: form.reference.trim(),
    });

    if (rpcError) {
      console.error("Erro ao criar pedido:", rpcError);

      const message = rpcError.message || "";

      if (message.includes("PECA_INDISPONIVEL")) {
        const title = message.split("PECA_INDISPONIVEL:")[1]?.trim();

        setError(
          `${title ? `"${title}"` : "Uma das peças"} não está mais disponível. Ela saiu do seu carrinho.`
        );
        await refresh();
      } else if (message.includes("LOGIN_NECESSARIO")) {
        router.push("/login?next=/checkout");
        return;
      } else if (message.includes("TELEFONE_INVALIDO")) {
        setError("Digite um telefone válido, com DDD.");
      } else if (message.includes("ENTREGA_SO_MS")) {
        setError("No momento entregamos somente em Mato Grosso do Sul.");
      } else if (message.includes("MOTOBOY_SO_CAMPO_GRANDE")) {
        setError("A entrega por motoboy é só em Campo Grande.");
      } else if (message.includes("MUITOS_PEDIDOS_PENDENTES")) {
        setError(
          "Você já tem pedidos aguardando pagamento. Pague ou espere expirar antes de fazer outro."
        );
      } else if (message.includes("ENDERECO_INVALIDO")) {
        setError("Preencha o endereço completo.");
      } else {
        setError("Não foi possível criar o pedido agora. Tente de novo em instantes.");
      }

      setSubmitting(false);
      return;
    }

    clear();
    router.push(`/pedidos/${data}`);
  }

  if (auth === "checking") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center text-text-muted">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (auth === "guest") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="mb-2 text-xl font-bold text-text">
            Entre para finalizar a compra
          </h1>
          <p className="mb-6 text-sm text-text-muted">
            Para acompanhar seu pedido, entre na sua conta ou crie uma. O seu
            carrinho fica guardado.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login?next=/checkout"
              className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-full border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/5"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center">
          {notice && (
            <p className="mx-auto mb-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {notice}
            </p>
          )}
          <p className="mb-4 text-text-muted">Seu carrinho está vazio</p>
          <Link href="/produtos" className="font-medium text-primary">
            Ver peças
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-text">Finalizar pedido</h1>

        {notice && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {notice}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_340px]"
        >
          <div className="space-y-6">
            {/* Seus dados */}
            <section className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-text">Seus dados</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(67) 99999-9999"
                    autoComplete="tel"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Como receber */}
            <section className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-text">Como você quer receber?</h2>

              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                      delivery === option.value
                        ? "border-primary bg-primary/5"
                        : "border-primary-light hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.value}
                      checked={delivery === option.value}
                      onChange={() => {
                        setDelivery(option.value);
                        setError("");
                      }}
                      className="mt-1 accent-[#e91e63]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-text">
                        {option.title}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {option.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Endereço */}
            {delivery !== "pickup" && (
              <section className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-text">Endereço de entrega</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.zip}
                        onChange={(e) => handleZipChange(e.target.value)}
                        placeholder="00000-000"
                        autoComplete="postal-code"
                        className={inputClass}
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-text-muted" />
                      )}
                    </div>
                    {cepError && (
                      <p className="mt-1 text-xs text-amber-700">{cepError}</p>
                    )}
                  </div>

                  <div className="hidden sm:block" />

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => updateField("street", e.target.value)}
                      autoComplete="address-line1"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Número
                    </label>
                    <input
                      type="text"
                      value={form.number}
                      onChange={(e) => updateField("number", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Complemento (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.complement}
                      onChange={(e) => updateField("complement", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={form.neighborhood}
                      onChange={(e) => updateField("neighborhood", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        updateField("state", e.target.value.toUpperCase().slice(0, 2))
                      }
                      placeholder="MS"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">
                      Ponto de referência (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.reference}
                      onChange={(e) => updateField("reference", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Resumo */}
          <aside className="h-fit rounded-2xl border border-primary-light bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="mb-4 font-semibold text-text">Resumo do pedido</h2>

            <div className="mb-4 space-y-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-text">
                    {product.title}
                    {quantity > 1 ? ` (x${quantity})` : ""}
                  </span>
                  <span className="whitespace-nowrap font-medium text-text">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-primary-light pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Entrega</span>
                <span className="text-text-muted">A combinar pelo WhatsApp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-text">Total das peças</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitting ? "Criando pedido..." : "Finalizar pedido"}
            </button>

            <p className="mt-3 text-center text-xs text-text-muted">
              As peças ficam reservadas por 30 minutos para você pagar por Pix.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
