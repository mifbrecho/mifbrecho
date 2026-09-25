import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
 
/**
 * Guarda do painel /admin.
 * - Sem login  → vai para /login (e volta para o /admin depois de entrar)
 * - Logada, mas não é admin → vai para a página inicial
 * - Admin sem autenticador configurado → tela de configuração (/admin/seguranca)
 * - Admin com autenticador, sem o código deste login → /admin/verificar
 * - Admin com o código confirmado → entra
 *
 * IMPORTANTE: este arquivo precisa ficar em apps/web/src/middleware.ts
 * (o projeto usa a pasta src, então na raiz o Next.js ignora).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
 
          response = NextResponse.next({
            request,
          });
 
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
 
  // getUser() confere o login direto no Supabase (mais seguro que getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  function redirectTo(pathname: string, search = "") {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
 
    const redirect = NextResponse.redirect(url);
 
    // mantém os cookies de sessão que o Supabase possa ter renovado
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
 
    return redirect;
  }
 
  if (!user) {
    const destination = request.nextUrl.pathname + request.nextUrl.search;
    return redirectTo("/login", `?next=${encodeURIComponent(destination)}`);
  }
 
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
 
  if (error) {
    console.error("Erro ao verificar perfil do admin:", error.message);
  }
 
  if (profile?.role !== "admin") {
    return redirectTo("/");
  }
 
  // Verificação em duas etapas (código do app autenticador) obrigatória no painel
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const path = request.nextUrl.pathname;
 
  if (aal) {
    if (aal.nextLevel === "aal1") {
      // ainda não configurou o autenticador: só pode ir para a tela de configuração
      if (!path.startsWith("/admin/seguranca")) {
        return redirectTo("/admin/seguranca");
      }
    } else if (aal.currentLevel !== "aal2") {
      // configurou, mas ainda não digitou o código neste login
      if (!path.startsWith("/admin/verificar")) {
        return redirectTo(
          "/admin/verificar",
          `?next=${encodeURIComponent(path + request.nextUrl.search)}`
        );
      }
    }
  }
 
  return response;
}
 
// Só roda no painel admin (não deixa o resto do site mais lento)
export const config = {
  matcher: ["/admin/:path*"],
};
