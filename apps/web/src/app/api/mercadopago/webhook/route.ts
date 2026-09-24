import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
 
// Confere se o aviso realmente veio do Mercado Pago (evita gente forjando
// "pagamento aprovado" chamando essa URL direto).
// Formato oficial: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/webhooks
 
type SignatureCheck = {
  valid: boolean;
  // informações seguras para diagnóstico (nunca inclui a chave nem o hash)
  info: Record<string, unknown>;
};
 
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
 
function checkSignature(req: Request, dataId: string): SignatureCheck {
  // remove espaços e aspas que às vezes sobram ao colar a chave na Vercel
  const secret = (process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
 
  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
 
  const parts: Record<string, string> = {};
  if (signatureHeader) {
    for (const piece of signatureHeader.split(",")) {
      const [key, value] = piece.split("=");
      if (key && value) parts[key.trim()] = value.trim();
    }
  }
 
  const ts = parts.ts;
  const hash = parts.v1;
 
  const info: Record<string, unknown> = {
    secretLength: secret.length,
    hasSignatureHeader: Boolean(signatureHeader),
    hasRequestId: Boolean(requestId),
    hasTs: Boolean(ts),
    hasV1: Boolean(hash),
    v1Length: hash ? hash.length : 0,
    dataIdLength: dataId.length,
    dataIdHasUppercase: dataId !== dataId.toLowerCase(),
  };
 
  if (!secret || !signatureHeader || !requestId || !ts || !hash) {
    return { valid: false, info };
  }
 
  // O Mercado Pago pede o id em minúsculas quando é alfanumérico;
  // por garantia, tenta as duas formas.
  const candidates = Array.from(new Set([dataId.toLowerCase(), dataId]));
 
  for (const candidate of candidates) {
    const manifest = `id:${candidate};request-id:${requestId};ts:${ts};`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");
 
    if (safeEqual(expected, hash)) {
      return { valid: true, info };
    }
  }
 
  return { valid: false, info };
}
 
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";
 
  if (!dataId) {
    // notificação que a gente não trata — responde ok pra Mercado Pago não insistir
    console.log("Webhook Mercado Pago: aviso sem data.id, ignorado");
    return NextResponse.json({ ok: true });
  }
 
  const check = checkSignature(req, dataId);
 
  if (!check.valid) {
    console.error(
      "Webhook Mercado Pago: assinatura inválida ou ausente",
      JSON.stringify(check.info)
    );
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
 
  console.log("Webhook Mercado Pago: aviso válido recebido", dataId);
 
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
 
  if (!token) {
    console.error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    return NextResponse.json({ error: "Config ausente" }, { status: 500 });
  }
 
  // nunca confia no corpo do webhook — busca o pedido direto na API.
  // dataId aqui é o ID do PEDIDO (Orders API), não de um pagamento.
  let orderResponse: Response;
 
  try {
    orderResponse = await fetch(
      `https://api.mercadopago.com/v1/orders/${dataId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    // falha de rede: devolve erro pro Mercado Pago tentar de novo depois
    console.error("Webhook Mercado Pago: falha de rede ao consultar o pedido:", dataId);
    return NextResponse.json({ error: "Falha temporária" }, { status: 502 });
  }
 
  if (!orderResponse.ok) {
    console.error(
      "Não foi possível confirmar o pedido no Mercado Pago:",
      dataId,
      orderResponse.status
    );
 
    // pedido que não existe (ex.: notificação de teste): não adianta insistir
    if (orderResponse.status === 404 || orderResponse.status === 400) {
      return NextResponse.json({ ok: true });
    }
 
    // qualquer outro erro (instabilidade, limite de chamadas, credencial):
    // devolve erro pro Mercado Pago repetir o aviso, pra não perder o pagamento
    return NextResponse.json({ error: "Falha temporária" }, { status: 502 });
  }
 
  const mpOrder = await orderResponse.json();
 
  const payment = mpOrder?.transactions?.payments?.[0];
  const isApproved =
    payment?.status === "approved" || mpOrder?.status === "processed";
 
  if (!isApproved) {
    return NextResponse.json({ ok: true });
  }
 
  const orderId: string | undefined = mpOrder.external_reference;
 
  if (!orderId) {
    return NextResponse.json({ ok: true });
  }
 
  // só aqui usa a chave de serviço — nunca no frontend, e só depois de
  // confirmar a assinatura e o status direto na API do Mercado Pago
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
 
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("pix_payment_id", String(dataId))
    .eq("status", "pending_payment")
    .select("id");
 
  if (error) {
    console.error("Erro ao marcar pedido como pago:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
 
  if (!updated || updated.length === 0) {
    // nenhum pedido pendente foi atualizado: ou já estava pago (aviso repetido,
    // normal) ou o pedido foi cancelado antes do pagamento chegar (grave)
    const { data: current } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
 
    if (current?.status === "cancelled") {
      console.error(
        "ALERTA: pagamento aprovado em pedido CANCELADO. Reembolsar a cliente.",
        { orderId, mercadoPagoOrderId: dataId }
      );
    }
  }
 
  console.log("Webhook Mercado Pago: pedido processado", orderId);
 
  return NextResponse.json({ ok: true });
}
 
// Mercado Pago testa a URL com GET ao salvar o webhook
export async function GET() {
  return NextResponse.json({ ok: true });
}
