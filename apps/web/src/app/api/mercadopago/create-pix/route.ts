import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PIX_RESERVATION_MINUTES } from "@/lib/orders";
 
export async function POST(req: Request) {
  let orderId: string | undefined;
 
  try {
    const body = await req.json();
    orderId = body?.order_id;
  } catch {
    // Corpo inválido ou vazio.
  }
 
  if (!orderId) {
    return NextResponse.json(
      { error: "order_id obrigatório" },
      { status: 400 }
    );
  }
 
  const supabase = await createClient();
 
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }
 
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, pix_qr_code, pix_copy_paste"
    )
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();
 
  if (orderError || !order) {
    return NextResponse.json(
      { error: "Pedido não encontrado" },
      { status: 404 }
    );
  }
 
  // Se o Pix já foi criado, reutiliza o mesmo.
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
 
  /*
   * TESTE DO MERCADO PAGO
   *
   * Se MERCADOPAGO_TEST_PAYER_EMAIL estiver configurado, usa o
   * comprador de teste com first_name "APRO". Esse é o gatilho oficial
   * do Mercado Pago pra aprovar o Pix de teste sozinho, sem pagamento
   * real (documentação: compra teste com Pix, Checkout API Orders).
   *
   * Importante: pra esse gatilho funcionar, a requisição precisa ficar
   * bem parecida com o exemplo oficial — por isso NÃO mandamos
   * expiration_time customizado quando é comprador de teste.
   */
  const testPayerEmail =
    process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
 
  const isTestPayer = Boolean(testPayerEmail);
 
  const payerEmail = testPayerEmail || user.email;
 
  if (!payerEmail) {
    return NextResponse.json(
      { error: "E-mail do comprador não encontrado" },
      { status: 400 }
    );
  }
 
  /*
   * total_amount é enviado em reais.
   * O banco do MIF BRECHO armazena o valor em centavos.
   * Exemplo: 7990 -> "79.90"
   */
  const amount = (order.total_amount / 100).toFixed(2);
 
  const mpResponse = await fetch(
    "https://api.mercadopago.com/v1/orders",
    {
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
        processing_mode: "automatic",
 
        payer: {
          email: payerEmail,
 
          ...(isTestPayer
            ? {
                first_name: "APRO",
              }
            : {}),
        },
 
        transactions: {
          payments: [
            {
              amount,
              payment_method: {
                id: "pix",
                type: "bank_transfer",
              },
 
              // O Pix vence junto com a reserva da peça (30 min), pra
              // ninguém pagar um Pix depois que o pedido já foi cancelado.
              // Em modo de teste, NÃO mandamos esse campo, porque o
              // gatilho de aprovação automática do Mercado Pago só
              // funciona com a requisição "padrão", sem esse extra.
              ...(isTestPayer
                ? {}
                : {
                    expiration_time: `PT${PIX_RESERVATION_MINUTES}M`,
                  }),
            },
          ],
        },
      }),
    }
  );
 
  const mpData = await mpResponse.json();
 
  if (!mpResponse.ok) {
    console.error(
      "Erro Mercado Pago:",
      JSON.stringify(mpData, null, 2)
    );
 
    return NextResponse.json(
      {
        error: "Não foi possível gerar o Pix agora",
        details:
          process.env.NODE_ENV === "development"
            ? mpData
            : undefined,
      },
      { status: 502 }
    );
  }
 
  const payment = mpData?.transactions?.payments?.[0];
 
  const qrCode: string | null =
    payment?.payment_method?.qr_code ?? null;
 
  const qrCodeBase64: string | null =
    payment?.payment_method?.qr_code_base64 ?? null;
 
  const mpOrderId: string | null =
    mpData?.id ? String(mpData.id) : null;
 
  if (!qrCode || !mpOrderId) {
    console.error(
      "Resposta inesperada do Mercado Pago:",
      JSON.stringify(mpData, null, 2)
    );
 
    return NextResponse.json(
      { error: "Resposta inesperada do Mercado Pago" },
      { status: 502 }
    );
  }
 
  const { error: saveError } = await supabase.rpc(
    "save_order_pix_data",
    {
      p_order_id: orderId,
      p_payment_id: mpOrderId,
      p_qr_code: qrCodeBase64,
      p_copy_paste: qrCode,
    }
  );
 
  if (saveError) {
    console.error(
      "Erro ao salvar Pix no pedido:",
      saveError
    );
 
    return NextResponse.json(
      { error: "Pix gerado, mas não foi possível salvar" },
      { status: 500 }
    );
  }
 
  return NextResponse.json({
    pix_qr_code: qrCodeBase64,
    pix_copy_paste: qrCode,
  });
}
