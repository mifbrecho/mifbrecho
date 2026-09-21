// Manifesto do app do PAINEL (admin), instalável separado do app da loja.
// Fica fora de /admin de propósito: o navegador lê este arquivo sem estar logado.
 
export function GET(request: Request) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
 
  // No endereço próprio do painel (admin.mifbrecho.com.br) o app cobre o site todo,
  // inclusive a tela de login, e não se mistura com o app da loja.
  const onAdminDomain = host.startsWith("admin.");
 
  const manifest = {
    name: "MIF BRECHO Admin",
    short_name: "MIF Admin",
    description: "Painel da loja MIF BRECHO: pedidos, peças e estoque.",
    id: "/admin",
    start_url: "/admin",
    scope: onAdminDomain ? "/" : "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdeaf1",
    theme_color: "#e91e63",
    lang: "pt-BR",
    icons: [
      { src: "/pwa-icon/192?variant=admin", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512?variant=admin", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa-icon/512?variant=admin&maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
 
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
