-- Exige uma sessão com o segundo fator confirmado para qualquer policy
-- administrativa. Isso protege a API do Supabase diretamente, não apenas
-- as telas que passam pelo middleware do Next.js.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (
      select 1
      from public.profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

-- Recria as policies administrativas para que bancos que foram instalados
-- a partir de 001_initial_schema.sql também recebam a exigência de AAL2.
drop policy if exists "Admin vê todos os perfis" on public.profiles;
create policy "Admin vê todos os perfis"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admin gerencia categorias" on public.categories;
create policy "Admin gerencia categorias"
  on public.categories for all
  using (public.is_admin());

drop policy if exists "Todos veem produtos disponíveis" on public.products;
create policy "Todos veem produtos disponíveis"
  on public.products for select
  using (status = 'available' or public.is_admin());

drop policy if exists "Admin gerencia produtos" on public.products;
create policy "Admin gerencia produtos"
  on public.products for all
  using (public.is_admin());

drop policy if exists "Admin gerencia imagens" on public.product_images;
create policy "Admin gerencia imagens"
  on public.product_images for all
  using (public.is_admin());

drop policy if exists "Admin vê todos os pedidos" on public.orders;
create policy "Admin vê todos os pedidos"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admin atualiza pedidos" on public.orders;
create policy "Admin atualiza pedidos"
  on public.orders for update
  using (public.is_admin());

drop policy if exists "Admin vê todos os itens" on public.order_items;
create policy "Admin vê todos os itens"
  on public.order_items for select
  using (public.is_admin());
