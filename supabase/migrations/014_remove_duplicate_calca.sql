-- Remove a categoria "Calça" (slug 'calca') criada por engano na
-- migration 013 — a loja já tinha uma categoria "Calças" antes disso.
-- Como products.category_id é "on delete set null", isso é seguro: se
-- por acaso alguma peça tiver sido cadastrada com essa categoria nesse
-- meio tempo, ela só fica sem categoria, não quebra nada.
 
delete from public.categories
where slug = 'calca';
