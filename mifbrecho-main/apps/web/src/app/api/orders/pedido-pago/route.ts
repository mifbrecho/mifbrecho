import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { STORE } from "@/lib/store-info";
 
// Chamado pelo Supabase (Database Webhook) toda vez que um pedido é
// atualizado. Se o status virou "paid" (e não estava "paid" antes),
// manda um e-mail de confirmação pra cliente.
//
// Funciona não importa QUEM mudou o status pra "pago" — o webhook do
// Mercado Pago, o robô que confere pagamento, ou a lojista marcando
// manualmente no painel. O gatilho é sempre a mudança no banco.
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
type SupabaseWebhookPayload = {
  type?: string;
  table?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};
 
function centavosParaReais(valor: number): string {
  return (valor / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
 
export async function POST(request: Request) {
  const secret = process.env.ORDER_EMAIL_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
 
  if (!secret || !resendKey) {
    console.error("ORDER_EMAIL_SECRET ou RESEND_API_KEY não configurado");
    return Response.json({ error: "E-mail não configurado." }, { status: 503 });
  }
 
  // só o Supabase (que sabe o segredo) pode chamar essa rota
  const received = Buffer.from(request.headers.get("x-order-secret") ?? "");
  const expected = Buffer.from(secret);
 
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
 
  let payload: SupabaseWebhookPayload;
 
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
 
  const record = payload.record;
  const oldRecord = payload.old_record;
 
  const virouPago =
    payload.table === "orders" &&
    record?.status === "paid" &&
    oldRecord?.status !== "paid";
 
  if (!virouPago || typeof record?.id !== "string") {
    // Não é uma confirmação de pagamento — ignora sem erro.
    return Response.json({ skipped: true });
  }
 
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
 
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, total_amount, customer:profiles(email, full_name), items:order_items(quantity, unit_price, product:products(title, size))"
    )
    .eq("id", record.id)
    .maybeSingle();
 
  if (error || !order) {
    console.error("Pedido não encontrado pra mandar e-mail:", error);
    return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
 
  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
 
  if (!customer?.email) {
    return Response.json({ skipped: true, reason: "Cliente sem e-mail." });
  }
 
  const numeroPedido = String(order.id).slice(0, 8).toUpperCase();
  const linkPedido = `${STORE.siteUrl}/pedidos/${order.id}`;
 
  type Item = {
    quantity: number;
    unit_price: number;
    product: { title: string; size: string | null } | { title: string; size: string | null }[] | null;
  };
 
  const linhasItens = ((order.items ?? []) as Item[])
    .map((item) => {
      const produto = Array.isArray(item.product) ? item.product[0] : item.product;
      const nome = produto?.title ?? "Peça";
      const tamanho = produto?.size ? ` (tam. ${produto.size})` : "";
 
      return `<tr>
        <td style="padding:8px 0;color:#4A148C;">${nome}${tamanho}</td>
        <td style="padding:8px 0;text-align:right;color:#4A148C;">${centavosParaReais(item.unit_price)}</td>
      </tr>`;
    })
    .join("");
 
  const html = `
  <div style="font-family:Arial,sans-serif;background:#FFF5F8;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <div style="background:#E91E63;padding:24px;text-align:center;">
        <h1 style="color:#FFFFFF;margin:0;font-size:22px;">${STORE.name}</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#4A148C;font-size:18px;margin-top:0;">Recebemos seu pagamento! 💕</h2>
        <p style="color:#4A148C;line-height:1.5;">
          Oi, ${customer.full_name ?? "tudo bem"}! Seu pedido <strong>#${numeroPedido}</strong>
          foi confirmado e já vamos começar a separar suas peças com carinho.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          ${linhasItens}
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid #FCE4EC;color:#4A148C;font-weight:bold;">Total</td>
            <td style="padding:12px 0 0;border-top:1px solid #FCE4EC;text-align:right;color:#4A148C;font-weight:bold;">
              ${centavosParaReais(Number(order.total_amount))}
            </td>
          </tr>
        </table>
        <p style="text-align:center;margin:24px 0;">
          <a href="${linkPedido}" style="background:#E91E63;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block;">
            Acompanhar meu pedido
          </a>
        </p>
        <p style="color:#9C27B0;font-size:13px;line-height:1.5;">
          Qualquer dúvida, chama a gente no WhatsApp ${STORE.whatsappDisplay}.
        </p>
      </div>
    </div>
  </div>`;
 
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${STORE.name} <pedidos@mifbrecho.com.br>`,
      to: customer.email,
      subject: `Pagamento confirmado — pedido #${numeroPedido}`,
      html,
    }),
  });
 
  if (!resendResponse.ok) {
    const detalhe = await resendResponse.text();
    console.error("Erro ao enviar e-mail (Resend):", resendResponse.status, detalhe);
    return Response.json({ error: "Falha ao enviar e-mail." }, { status: 502 });
  }
 
  return Response.json({ sent: true });
}
