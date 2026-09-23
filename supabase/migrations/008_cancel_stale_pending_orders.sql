-- 008_cancel_stale_pending_orders.sql
-- Pedido "Aguardando Pix" que a cliente nunca paga travava a peça pra
-- sempre (ela nunca voltava pra vitrine). Agora, depois de 30 minutos
-- sem pagamento, o pedido é cancelado sozinho e a peça volta ao estoque.
 
create or replace function public.cancel_stale_pending_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  for v_order in
    select id from public.orders
    where status = 'pending_payment'
      and created_at < now() - interval '30 minutes'
  loop
    for v_item in
      select product_id, quantity from public.order_items
      where order_id = v_order.id
    loop
      update public.products
        set stock = stock + v_item.quantity,
            status = case when status = 'sold' then 'available' else status end
        where id = v_item.product_id;
    end loop;
 
    update public.orders set status = 'cancelled' where id = v_order.id;
  end loop;
end;
$$;
 
-- Precisa estar ligado 1x no painel do Supabase:
-- Database → Extensions → ativar "pg_cron"
create extension if not exists pg_cron with schema extensions;
 
select cron.schedule(
  'cancelar-pedidos-pendentes-antigos',
  '*/5 * * * *',
  $$select public.cancel_stale_pending_orders()$$
);
