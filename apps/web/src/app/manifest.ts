import type { MetadataRoute } from "next";
 
// Faz o site poder ser instalado como app no celular e no computador
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MIF BRECHO",
    short_name: "MIF BRECHO",
    description:
      "Brechó online de Campo Grande - MS. Peças únicas e selecionadas, com entrega e retirada.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdeaf1",
    theme_color: "#e91e63",
    lang: "pt-BR",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa-icon/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
