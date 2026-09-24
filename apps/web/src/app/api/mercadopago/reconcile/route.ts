import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
 
// Rede de segurança automática: a cada 1 minuto, o Supabase chama esta
// rota sozinho (via pg_cron + pg_net). Ela olha os pedidos "Aguardando
// Pix" e pergunta direto ao Mercado Pago se já foram pagos. Assim o
// pedido vira "Pago" mesmo se o aviso automático do Mercado Pago
// (webhook) atrasar ou não chegar.
//
// Só quem sabe o segredo (o robô do Supabase) pode chamar esta rota.
 
export const dynamic = "force-dynamic";
 
function isAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
 
  const received = req.headers.get("x-cron-secret") ?? "";
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
 
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
 
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
 
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
 
  if (!token) {
    console.error("Reconcile: MERCADOPAGO_ACCESS_TOKEN não configurado");
    return NextResponse.json({ error: "Config ausente" }, { status: 500 });
  }
 
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
 
  // só pedidos que ainda podem estar dentro da janela do Pix (35 min de
  // folga em cima dos 30 min de reserva)
  const { data: pendingOrders, error } = await supabase
    .from("orders")
    .select("id, pix_payment_id")
    .eq("status", "pending_payment")
    .not("pix_payment_id", "is", null)
    .gte("created_at", new Date(Date.now() - 35 * 60_000).toISOString())
    .limit(25);
 
  if (error) {
    console.error("Reconcile: erro ao buscar pedidos pendentes", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
 
  let checked = 0;
  let updated = 0;
 
  for (const order of pendingOrders ?? []) {
    checked++;
 
    let mpResponse: Response;
 
    try {
      mpResponse = await fetch(
        `https://api.mercadopago.com/v1/orders/${order.pix_payment_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      console.error("Reconcile: falha de rede consultando pedido", order.id);
      continue;
    }
 
    if (!mpResponse.ok) continue;
 
    const mpOrder = await mpResponse.json();
    const payment = mpOrder?.transactions?.payments?.[0];
    const isApproved =
      payment?.status === "approved" || mpOrder?.status === "processed";
 
    if (!isApproved) continue;
 
    const { data: result, error: updateError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", order.id)
      .eq("pix_payment_id", order.pix_payment_id as string)
      .eq("status", "pending_payment")
      .select("id");
 
    if (updateError) {
      console.error("Reconcile: erro ao marcar pedido como pago", order.id, updateError);
      continue;
    }
 
    if (result && result.length > 0) {
      updated++;
      console.log("Reconcile: pedido marcado como pago", order.id);
    }
  }
 
  return NextResponse.json({ checked, updated });
}
