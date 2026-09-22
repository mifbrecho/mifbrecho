-- 003_fix_role_escalation.sql
-- Corrige falha: qualquer cliente logado podia trocar o próprio
-- "role" para 'admin' via update direto em profiles (a policy
-- "Usuários atualizam próprio perfil" não restringia colunas).
--
-- Solução: trigger que barra troca de role por quem não é admin,
-- independente de qual policy de UPDATE estiver ativa na tabela.
 
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'SEM_PERMISSAO: apenas administradores podem alterar role';
  end if;
  return new;
end;
$$;
 
drop trigger if exists trg_prevent_role_escalation on public.profiles;
 
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();
