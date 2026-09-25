-- 005_storage_product_images.sql
-- Garante em código (não só manualmente no painel) que o bucket de fotos
-- dos produtos é público pra LEITURA, mas só admin pode enviar/editar/
-- apagar arquivo.
 
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
 
drop policy if exists "Leitura pública das fotos de produtos" on storage.objects;
create policy "Leitura pública das fotos de produtos"
  on storage.objects for select
  using (bucket_id = 'product-images');
 
drop policy if exists "Admin envia fotos de produtos" on storage.objects;
create policy "Admin envia fotos de produtos"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());
 
drop policy if exists "Admin atualiza fotos de produtos" on storage.objects;
create policy "Admin atualiza fotos de produtos"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());
 
drop policy if exists "Admin apaga fotos de produtos" on storage.objects;
create policy "Admin apaga fotos de produtos"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
