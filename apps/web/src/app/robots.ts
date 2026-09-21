import type { MetadataRoute } from "next";
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas privadas ou sem utilidade na busca
        disallow: [
          "/admin",
          "/api/",
          "/conta",
          "/carrinho",
          "/checkout",
          "/pedidos",
          "/favoritos",
          "/login",
          "/cadastro",
          "/recuperar-senha",
          "/redefinir-senha",
        ],
      },
    ],
    sitemap: "https://www.mifbrecho.com.br/sitemap.xml",
    host: "https://www.mifbrecho.com.br",
  };
}
