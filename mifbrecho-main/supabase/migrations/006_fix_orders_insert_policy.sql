-- 006_fix_orders_insert_policy.sql
-- Corrige falha: a policy "Cliente cria pedido" só checava
-- auth.uid() = customer_id, sem restringir status/total_amount.
-- Isso permitia inserir pedido direto (fora da função create_order)
-- já como 'paid' e total_amount 0, sem passar pela validação de
-- estoque/preço nem pagamento.
--
-- A partir de agora ninguém insere direto em orders — só a função
-- create_order (security definer), igual já foi feito em order_items.
 
drop policy if exists "Cliente cria pedido" on public.orders;
 
create policy "Ninguém insere pedido direto na tabela"
  on public.orders for insert
  with check (false);
