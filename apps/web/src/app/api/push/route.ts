import { createECDH, createHmac, timingSafeEqual } from "crypto";
import * as webpush from "web-push";
 
// Envia os avisos (notificações) para o celular das administradoras.
// GET  → devolve a chave pública que o celular usa para se registrar.
// POST → recebe do banco de dados o pedido de envio (protegido por um segredo).
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
const SUBJECT = "mailto:mifbrecho@gmail.com";
 
/**
 * As chaves de envio (VAPID) são calculadas a partir do segredo PUSH_WEBHOOK_SECRET.
 * Assim só existe UM segredo para guardar, e ninguém precisa gerar chaves.
 */
function getKeys(): { publicKey: string; privateKey: string } | null {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
 
  if (!secret || secret.length < 24) return null;
 
  for (let counter = 0; counter < 20; counter++) {
    const scalar = createHmac("sha256", secret)
      .update(`mif-vapid-${counter}`)
      .digest();
 
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(scalar);
 
      return {
        publicKey: ecdh.getPublicKey().toString("base64url"),
        privateKey: scalar.toString("base64url"),
      };
    } catch {
      // número inválido para a curva (quase impossível): tenta o próximo
    }
  }
 
  return null;
}
 
export async function GET() {
  const keys = getKeys();
 
  if (!keys) {
    return Response.json(
      { error: "Avisos ainda não configurados no servidor." },
      { status: 503 }
    );
  }
 
  return Response.json(
    { publicKey: keys.publicKey },
    { headers: { "Cache-Control": "no-store" } }
  );
}
 
type IncomingSubscription = {
  endpoint?: unknown;
  p256dh?: unknown;
  auth?: unknown;
};
 
export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const keys = getKeys();
 
  if (!secret || !keys) {
    return Response.json({ error: "Avisos não configurados." }, { status: 503 });
  }
 
  // só o nosso banco de dados conhece o segredo
  const received = Buffer.from(request.headers.get("x-push-secret") ?? "");
  const expected = Buffer.from(secret);
 
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
 
  let payload: {
    title?: unknown;
    body?: unknown;
    url?: unknown;
    tag?: unknown;
    subscriptions?: unknown;
  };
 
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
 
  const subscriptions = (
    Array.isArray(payload.subscriptions) ? payload.subscriptions : []
  ).slice(0, 50) as IncomingSubscription[];
 
  const message = JSON.stringify({
    title: String(payload.title ?? "MIF BRECHO").slice(0, 100),
    body: String(payload.body ?? "").slice(0, 200),
    url:
      typeof payload.url === "string" && payload.url.startsWith("/")
        ? payload.url
        : "/admin/pedidos",
    tag: String(payload.tag ?? "pedido").slice(0, 80),
  });
 
  webpush.setVapidDetails(SUBJECT, keys.publicKey, keys.privateKey);
 
  const results = await Promise.allSettled(
    subscriptions
      .filter(
        (s) =>
          typeof s.endpoint === "string" &&
          s.endpoint.startsWith("https://") &&
          typeof s.p256dh === "string" &&
          typeof s.auth === "string"
      )
      .map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint as string,
            keys: { p256dh: s.p256dh as string, auth: s.auth as string },
          },
          message,
          { TTL: 3600, urgency: "high" }
        )
      )
  );
 
  const sent = results.filter((r) => r.status === "fulfilled").length;
 
  return Response.json({ sent, failed: results.length - sent });
}
