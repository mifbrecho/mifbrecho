-- Permite "excluir" peças que já têm pedido vinculado sem quebrar o
-- histórico de vendas: em vez de apagar a linha (o que violaria a FK de
-- order_items e falha com erro 23503), ela é arquivada com deleted_at.
--
-- Peças arquivadas:
--   - somem da lista padrão do admin (a tela filtra deleted_at is null)
--   - continuam existindo para o join em pedidos antigos (título, fotos)
--   - nunca aparecem na loja (RLS já exige status = 'available')
 
alter table public.products
  add column if not exists deleted_at timestamptz;
 
create index if not exists products_deleted_at_idx
  on public.products(deleted_at);
 
-- Bug encontrado à parte: a policy de select de products só liberava
-- status = 'available' ou admin. Quando uma peça vendia (status vira
-- 'sold'), o próprio cliente perdia o acesso de leitura a ela — então
-- em "Meus pedidos" a foto/título sumiam (caía no placeholder "Peça").
-- Esta policy nova também libera o select quando o produto pertence a
-- um pedido do próprio usuário autenticado.
drop policy if exists "Todos veem produtos disponíveis" on public.products;
create policy "Todos veem produtos disponíveis"
  on public.products for select
  using (
    (status = 'available' and deleted_at is null)
    or public.is_admin()
    or exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = products.id
        and o.customer_id = auth.uid()
    )
  );
