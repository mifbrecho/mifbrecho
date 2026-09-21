import type { NextConfig } from "next";
 
// Endereços de onde o site pode carregar coisas (tudo o mais é bloqueado pelo navegador)
const contentSecurityPolicy = [
  "default-src 'self'",
  // o Next.js precisa de 'unsafe-inline' para os scripts que ele mesmo gera
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://placehold.co",
  "font-src 'self' data:",
  // banco de dados (Supabase) e busca de CEP
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://viacep.com.br",
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
 
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  transpilePackages: ["@mifre/shared"],
 
  // Cabeçalhos de segurança em todas as páginas
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
 
  // No endereço do painel (admin.mifbrecho.com.br), a página inicial é o painel
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "admin.mifbrecho.com.br" }],
        destination: "/admin",
        permanent: false,
      },
    ];
  },
};
 
export default nextConfig;
