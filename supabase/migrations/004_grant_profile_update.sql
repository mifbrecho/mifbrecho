-- 004_grant_profile_update.sql
-- Sem isso, ninguém logado consegue dar UPDATE em profiles — falha
-- antes mesmo de chegar na policy de RLS (erro "permission denied
-- for table profiles"). Concede UPDATE só nas colunas que o próprio
-- cliente pode alterar. Nunca inclui role, id ou email aqui.
 
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
