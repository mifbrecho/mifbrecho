-- Adiciona duas novas categorias pedidas pela loja: "Calça" e "Short".
-- Não há tela de admin para cadastrar categoria (o formulário de produto só
-- lista as que já existem na tabela), então elas entram direto via
-- migration, do mesmo jeito que as demais categorias já cadastradas.
--
-- on conflict (slug) do nothing: se você já tiver criado alguma delas na
-- mão pelo painel do Supabase, rodar essa migration não duplica nem dá erro.
 
insert into public.categories (name, slug, sort_order)
values
  ('Calça', 'calca', 20),
  ('Short', 'short', 21)
on conflict (slug) do nothing;
