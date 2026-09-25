-- 002_security_fixes.sql
-- Corrige a falha de fraude em order_items, cria a função create_order
-- (que o checkout já chama, mas não existia no banco) e organiza a
-- checagem de admin numa função só, pra não repetir subconsulta nas policies.

create extension if not exists "unaccent";

-- ======================
-- 1) Função helper: é admin?
-- ======================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Troca as policies que faziam a subconsulta direto na tabela profiles
-- (evita o aviso de recursão do Supabase e fica mais fácil de manter)
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

-- ======================
-- 2) Fecha o buraco de fraude em order_items
-- ======================
-- Antes: "with check (true)" deixava qualquer pessoa logada inserir
-- item em QUALQUER pedido com o preço que quisesse. A partir de agora
-- ninguém insere direto — só a função create_order (abaixo), que roda
-- como "security definer" e por isso ignora essa trava.
drop policy if exists "Sistema insere itens (via service role ou trigger)" on public.order_items;
create policy "Ninguém insere item direto na tabela"
  on public.order_items for insert
  with check (false);

-- ======================
-- 3) Função create_order — calcula preço e controla estoque no servidor
-- ======================
create or replace function public.create_order(
  p_items jsonb,
  p_delivery text,
  p_name text,
  p_phone text,
  p_zip text,
  p_street text,
  p_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state text,
  p_reference text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_qty integer;
  v_product record;
  v_total integer := 0;
  v_phone_digits text;
  v_pending_count integer;
  v_notes text := null;
begin
  if v_user is null then
    raise exception 'LOGIN_NECESSARIO';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'CARRINHO_VAZIO';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone_digits) < 10 then
    raise exception 'TELEFONE_INVALIDO';
  end if;

  if p_delivery <> 'pickup' then
    if upper(trim(coalesce(p_state, ''))) <> 'MS' then
      raise exception 'ENTREGA_SO_MS';
    end if;

    if trim(coalesce(p_street, '')) = '' or trim(coalesce(p_number, '')) = ''
       or trim(coalesce(p_neighborhood, '')) = '' or trim(coalesce(p_city, '')) = '' then
      raise exception 'ENDERECO_INVALIDO';
    end if;

    if p_delivery = 'motoboy' and lower(unaccent(trim(p_city))) <> 'campo grande' then
      raise exception 'MOTOBOY_SO_CAMPO_GRANDE';
    end if;
  end if;

  select count(*) into v_pending_count
  from public.orders
  where customer_id = v_user and status = 'pending_payment';

  if v_pending_count >= 3 then
    raise exception 'MUITOS_PEDIDOS_PENDENTES';
  end if;

  if p_delivery = 'pickup' then
    v_notes := 'Retirada na loja';
  end if;

  insert into public.orders (
    customer_id, status, total_amount,
    shipping_street, shipping_number, shipping_complement, shipping_neighborhood,
    shipping_city, shipping_state, shipping_zip_code, shipping_reference, notes
  ) values (
    v_user, 'pending_payment', 0,
    coalesce(p_street, ''), coalesce(p_number, ''), nullif(trim(coalesce(p_complement, '')), ''),
    coalesce(p_neighborhood, ''), coalesce(p_city, ''), upper(coalesce(p_state, '')),
    coalesce(p_zip, ''), nullif(trim(coalesce(p_reference, '')), ''), v_notes
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty < 1 then
      raise exception 'PECA_INDISPONIVEL: item inválido';
    end if;

    -- "for update" trava a linha: evita duas pessoas comprarem
    -- a última peça ao mesmo tempo
    select id, title, price, stock, status
      into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid
      for update;

    if v_product.id is null or v_product.status <> 'available' or v_product.stock < v_qty then
      raise exception 'PECA_INDISPONIVEL: %', coalesce(v_product.title, '');
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product.id, v_qty, v_product.price);

    v_total := v_total + v_product.price * v_qty;

    update public.products
      set stock = stock - v_qty,
          status = case when stock - v_qty <= 0 then 'sold' else status end
      where id = v_product.id;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;

  return v_order_id;
end;
$$;

-- Só quem está logado pode chamar a função (o "security definer" dela
-- já cuida do resto — RLS não se aplica dentro dela)
revoke all on function public.create_order(jsonb, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
