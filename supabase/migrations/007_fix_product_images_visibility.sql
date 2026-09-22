-- 007_fix_product_images_visibility.sql
-- Corrige falha: a policy "Todos veem imagens" liberava as fotos de
-- QUALQUER peça (inclusive oculta, reservada ou vendida) pra qualquer
-- pessoa, sem login, direto pela API do Supabase. Agora só mostra a
-- foto se a peça dona dela estiver com status 'available', ou se
-- quem está pedindo for admin (mesma regra já usada em "products").
 
drop policy if exists "Todos veem imagens" on public.product_images;
 
create policy "Vê imagem só de peça disponível (ou se for admin)"
  on public.product_images for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.products
      where id = product_images.product_id and status = 'available'
    )
  );
