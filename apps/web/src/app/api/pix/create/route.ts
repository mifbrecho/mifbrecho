import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // O navegador só precisa informar o ID do pedido.
    // NÃO confiamos em amount, customerEmail ou customerName.
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Pedido inválido" },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 500 }
      );
    }

    // Cliente Supabase com a sessão do usuário.
    const supabase = await createClient();

    // Verifica quem está fazendo a requisição.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Busca o pedido pertencente ao usuário autenticado.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, total_amount, status")
      .eq("id", orderId)
      .eq("customer_id", user.id)
      .single();

    if (orderError || !order) {
      console.error("Pedido não encontrado:", orderError);

      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Não permite gerar Pix para pedidos que já foram cancelados,
    // pagos ou finalizados.
    const allowedStatuses = ["pending"];

    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: "Este pedido não está disponível para pagamento" },
        { status: 409 }
      );
    }

    // total_amount está armazenado em CENTAVOS.
    // Exemplo: 2200 -> R$ 22,00
    const amount = Number(order.total_amount) / 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error("Valor inválido no pedido:", order.total_amount);

      return NextResponse.json(
        { error: "Valor do pedido inválido" },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: `Pedido MIF BRECHO #${order.id}`,
        payment_method_id: "pix",

        payer: {
          email: user.email!,
          first_name:
            user.user_metadata?.full_name?.split(" ")[0] ||
            user.user_metadata?.name?.split(" ")[0] ||
            "Cliente",
        },

        external_reference: order.id,

        notification_url:
          process.env.MERCADOPAGO_WEBHOOK_URL,
      },
    });

    const pixData =
      result.point_of_interaction?.transaction_data;

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      qrCode: pixData?.qr_code,
      qrCodeBase64: pixData?.qr_code_base64,
      ticketUrl: pixData?.ticket_url,
      expiresAt: result.date_of_expiration,
    });
  } catch (error: unknown) {
    console.error("Erro ao criar Pix:", error);

    return NextResponse.json(
      { error: "Erro interno ao gerar Pix" },
      { status: 500 }
    );
  }
}
