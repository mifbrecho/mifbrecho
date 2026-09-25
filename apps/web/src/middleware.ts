  // Verificação em duas etapas (código do app autenticador) obrigatória no painel
  const { data: aal, error: aalError } =
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
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

  // Nunca libera o painel quando a consulta de MFA falhar ou não devolver dados.
  // A checagem no banco (migration 010) protege as operações sensíveis também.
  if (aalError || !aal) {
    console.error("Erro ao verificar MFA do admin:", aalError?.message);
    return new NextResponse("Não foi possível verificar a autenticação em duas etapas.", {
      status: 503,
    });
  }

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
