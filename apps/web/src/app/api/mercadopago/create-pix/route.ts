import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
 
export async function POST(req: Request) {
  let orderId: string | undefined;
 
  try {
    const body = await req.json();
    orderId = body?.order_id;
  } catch {
    // corpo vazio ou inválido
  }
 
  if (!orderId) {
    return NextResponse.json({ error: "order_id obrigatório" }, { status: 400 });
  }
 
  const supabase = await createClient();
 
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
 
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total_amount, pix_qr_code, pix_copy_paste")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();
 
  if (orderError || !order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
 
  // já foi gerado antes (ex.: a pessoa recarregou a página) — devolve o mesmo
  if (order.pix_copy_paste) {
    return NextResponse.json({
      pix_qr_code: order.pix_qr_code,
      pix_copy_paste: order.pix_copy_paste,
    });
  }
 
  if (order.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Pedido não está aguardando pagamento" },
      { status: 400 }
    );
  }
 
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
 
  if (!token) {
    console.error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    return NextResponse.json(
      { error: "Pagamento indisponível no momento" },
      { status: 500 }
    );
  }
 
  // Modo de teste: o Mercado Pago só simula Pix em sandbox usando o e-mail
  // de um "usuário de teste" + o nome mágico "APRO" (aprova sozinho).
  // Em produção essa variável não deve existir, e nada disso é usado.
  const testPayerEmail = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
  const payerEmail = testPayerEmail || user.email;
 
  const amount = (order.total_amount / 100).toFixed(2);
 
  // O Mercado Pago descontinuou Pix pelo endpoint antigo (/v1/payments) em
  // modo de teste — a API atual (Orders) é a única que permite testar Pix
  // no sandbox, por isso usamos ela.
  const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": orderId,
    },
    body: JSON.stringify({
      type: "online",
      external_reference: orderId,
      total_amount: amount,
      description: `Pedido MIF BRECHO #${orderId.slice(0, 8).toUpperCase()}`,
      payer: {
        email: payerEmail,
        // "APRO" é o valor que o Mercado Pago reconhece pra aprovar a
        // simulação sozinho — só usado quando estamos testando
        ...(testPayerEmail ? { first_name: "APRO" } : {}),
      },
      transactions: {
        payments: [
          {
            amount,
            payment_method: { id: "pix", type: "bank_transfer" },
          },
        ],
      },
    }),
  });
 
  const mpData = await mpResponse.json();
 
  if (!mpResponse.ok) {
    console.error("Erro Mercado Pago:", JSON.stringify(mpData));
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix agora" },
      { status: 502 }
    );
  }
 
  const payment = mpData?.transactions?.payments?.[0];
  const qrCode: string | null = payment?.payment_method?.qr_code ?? null;
  const qrCodeBase64: string | null =
    payment?.payment_method?.qr_code_base64 ?? null;
  // guardamos o id do PEDIDO no Mercado Pago (não do pagamento) — é o que
  // vem no webhook pra gente confirmar depois
  const mpOrderId: string | null = mpData?.id ? String(mpData.id) : null;
 
  if (!qrCode || !mpOrderId) {
    console.error("Resposta inesperada do Mercado Pago:", mpData);
    return NextResponse.json(
      { error: "Resposta inesperada do Mercado Pago" },
      { status: 502 }
    );
  }
 
  const { error: saveError } = await supabase.rpc("save_order_pix_data", {
    p_order_id: orderId,
    p_payment_id: mpOrderId,
    p_qr_code: qrCodeBase64,
    p_copy_paste: qrCode,
  });
 
  if (saveError) {
    console.error("Erro ao salvar Pix no pedido:", saveError);
    return NextResponse.json(
      { error: "Pix gerado, mas não foi possível salvar" },
      { status: 500 }
    );
  }
 
  return NextResponse.json({ pix_qr_code: qrCodeBase64, pix_copy_paste: qrCode });
}
