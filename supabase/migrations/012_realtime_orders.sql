-- 012_realtime_orders.sql
-- Liga o Realtime na tabela orders, pra o painel poder "ouvir" quando um
-- pedido vira "paid" e disparar o aviso sonoro/visual (PaidOrderAlert).
-- As políticas de RLS continuam valendo: só quem já pode ver o pedido
-- (admin com AAL2, ver 010_require_aal2_for_admin.sql) recebe o evento.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
