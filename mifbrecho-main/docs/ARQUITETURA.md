# Arquitetura Técnica — MIF BRECHO

## Visão geral

```
┌─────────────────┐     ┌─────────────────┐
│  App Mobile     │     │  Site / Admin   │
│  (Expo)         │     │  (Next.js)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  Supabase   │
              │  (Postgres  │
              │   + Auth    │
              │   + Storage │
              │   + Realtime)│
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ Mercado Pago│
              │   (Pix)     │
              └─────────────┘
```

## Decisões de stack

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Web | Next.js 15 | SSR, App Router, fácil deploy na Vercel, um projeto serve cliente + admin |
| Mobile | Expo | Um código para Android e iOS, atualizações OTA, bom suporte a Supabase |
| Backend | Supabase | Auth pronta, RLS, storage de imagens, realtime (fila de pedidos), barato |
| Pagamento | Mercado Pago Pix | Padrão no Brasil, SDK oficial Node, webhook confiável |
| Estado carrinho | Zustand + persist | Simples e leve (localStorage) |

## Fluxo de pagamento Pix

1. Cliente finaliza o checkout → cria `order` com status `pending_payment`
2. Frontend chama `POST /api/pix/create`
3. Backend cria Payment no Mercado Pago com `payment_method_id: "pix"`
4. Retorna QR Code (base64) + copia-e-cola
5. Cliente paga
6. Mercado Pago chama webhook → backend atualiza order para `paid`
7. Admin vê o pedido na fila

## Segurança

- RLS no Supabase: cliente só vê seus pedidos; admin vê tudo
- Role `admin` no profile
- Token do Mercado Pago só no servidor
- Validação de assinatura do webhook (implementar)

## Deploy sugerido

- **Web**: Vercel (conecta com GitHub)
- **Mobile**: EAS Build + App Store / Google Play
- **Backend**: Supabase (já hospedado)
- **Domínio**: mifrebrecho.com.br (ou similar)

## Custos aproximados (início)

- Supabase Free tier → suficiente para começar
- Vercel Free → ok para MVP
- Mercado Pago: taxa por transação (~0,99% + R$ 0,99 no Pix, verificar tabela atual)
- EAS / stores: taxas de publicação

## Próximos desenvolvimentos

1. Middleware de autenticação no Next.js
2. CRUD completo de produtos no admin (com upload)
3. Listagem de pedidos com filtros de status
4. Tela de “rotas do dia” (agrupar por bairro)
5. App mobile com as mesmas telas
6. Notificação via WhatsApp (opcional, com Evolution API ou similar)
