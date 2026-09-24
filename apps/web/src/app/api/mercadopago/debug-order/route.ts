import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
 
// Rota TEMPORÁRIA só pra diagnóstico: consulta o status real do pedido
// direto na API do Mercado Pago. Remover depois de resolver o problema
// do Pix de teste.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
 
  if (!orderId) {
    return NextResponse.json(
      { error: "Use ?order_id=<id do pedido>" },
      { status: 400 }
    );
  }
 
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
 
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, pix_payment_id")
    .eq("id", orderId)
    .maybeSingle();
 
  if (orderError || !order) {
    return NextResponse.json(
      { error: "Pedido não encontrado no Supabase" },
      { status: 404 }
    );
  }
 
  if (!order.pix_payment_id) {
    return NextResponse.json(
      { error: "Esse pedido ainda não tem Pix gerado", order },
      { status: 400 }
    );
  }
 
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
 
  if (!token) {
    return NextResponse.json(
      { error: "MERCADOPAGO_ACCESS_TOKEN não configurado" },
      { status: 500 }
    );
  }
 
  const mpResponse = await fetch(
    `https://api.mercadopago.com/v1/orders/${order.pix_payment_id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
 
  const mpData = await mpResponse.json();
 
  return NextResponse.json({
    supabase_status: order.status,
    mercadopago_http_status: mpResponse.status,
    mercadopago_order: mpData,
  });
}
