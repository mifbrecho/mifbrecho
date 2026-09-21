import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  transpilePackages: ["@mifre/shared"],
 
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
