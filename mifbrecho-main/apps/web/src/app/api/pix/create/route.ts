import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

/**
 * Cria um pagamento Pix via Mercado Pago
 * Body esperado:
 * {
 *   orderId: string,
 *   amount: number, // em reais (ex: 49.90)
 *   customerEmail: string,
 *   customerName: string,
 *   description?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerEmail, customerName, description } = body;

    if (!orderId || !amount || !customerEmail) {
      return NextResponse.json(
        { error: "Dados incompletos" },
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

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description || `Pedido MIF BRECHO #${orderId}`,
        payment_method_id: "pix",
        payer: {
          email: customerEmail,
          first_name: customerName?.split(" ")[0] || "Cliente",
        },
        external_reference: orderId,
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL, // opcional
      },
    });

    const pixData = result.point_of_interaction?.transaction_data;

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
    const message =
      error instanceof Error ? error.message : "Erro interno ao gerar Pix";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
