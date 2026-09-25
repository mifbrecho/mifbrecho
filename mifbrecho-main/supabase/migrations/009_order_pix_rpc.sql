-- 009_order_pix_rpc.sql
-- Função pra salvar o QR code / copia-e-cola do Pix no pedido.
-- Precisa ser uma função (não um UPDATE direto) porque o cliente não
-- tem permissão de UPDATE em orders — só admin. A função confere que
-- quem está chamando é o dono do pedido, que o pedido ainda está
-- "Aguardando Pix", e que ainda não tinha Pix gerado (só gera uma vez).
 
create or replace function public.save_order_pix_data(
  p_order_id uuid,
  p_payment_id text,
  p_qr_code text,
  p_copy_paste text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
    set pix_payment_id = p_payment_id,
        pix_qr_code = p_qr_code,
        pix_copy_paste = p_copy_paste
    where id = p_order_id
      and customer_id = auth.uid()
      and status = 'pending_payment'
      and pix_payment_id is null;
 
  if not found then
    raise exception 'PEDIDO_INVALIDO';
  end if;
end;
$$;
 
grant execute on function public.save_order_pix_data(uuid, text, text, text) to authenticated;
