# 🎀 MIF BRECHO — App Completo

**Brechó feminino online** com tema rosa, pagamento **somente Pix**, entrega própria e painel administrativo.

## 📱 O que tem neste projeto

| Parte | Tecnologia | Descrição |
|-------|------------|---------|
| **Site + Painel Admin** | Next.js 15 (App Router) + Tailwind | Site de vendas + painel `/admin` |
| **App Mobile** | Expo (React Native) | App para clientes (Android + iOS) |
| **Backend** | Supabase | Auth, Postgres, Storage, Realtime |
| **Pagamento** | Mercado Pago (Pix) | Gera QR Code / copia-e-cola |
| **Tema** | Rosa feminino | Cores suaves, tipografia elegante |

---

## 🏗️ Arquitetura

```
mifre-brecho/
├── apps/
│   ├── web/                 → Next.js (cliente + admin)
│   └── mobile/              → Expo (app clientes)
├── packages/
│   ├── shared/              → tipos TypeScript, constantes, utils
│   └── ui/                  → componentes compartilhados (futuro)
├── supabase/
│   └── migrations/          → schema SQL
├── docs/                    → documentação extra
└── README.md
```

### Fluxo principal

1. **Admin** (irmã) entra no painel → cadastra produtos com fotos → define preço e estoque.
2. **Cliente** abre o site ou o app → navega nas peças → adiciona no carrinho.
3. No checkout: escolhe endereço de entrega → gera **Pix** via Mercado Pago.
4. Cliente paga o Pix → webhook do Mercado Pago confirma → pedido muda para "pago".
5. Admin vê na fila de pedidos → organiza rota de entrega → marca como "enviado" / "entregue".

---

## 🎨 Tema Rosa (Design System)

```ts
// packages/shared/theme.ts
export const colors = {
  primary: "#E91E63",        // Rosa principal
  primaryLight: "#F8BBD9",   // Rosa claro
  primaryDark: "#C2185B",    // Rosa escuro
  secondary: "#FCE4EC",      // Fundo suave
  accent: "#FF80AB",         // Destaque
  background: "#FFF5F8",     // Fundo geral
  surface: "#FFFFFF",
  text: "#4A148C",           // Roxo suave para contraste
  textMuted: "#9C27B0",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
};
```

Fontes sugeridas: **Poppins** ou **Nunito** (Google Fonts).

---

## 🗄️ Schema do Banco (Supabase)

Principais tabelas:

- `profiles` — usuários (clientes e admin)
- `products` — peças do brechó
- `product_images`
- `categories`
- `orders`
- `order_items`
- `addresses`
- `delivery_routes` (opcional, para organizar rotas)

Veja o arquivo completo em `supabase/migrations/001_initial_schema.sql`.

---

## 🚀 Como rodar (depois de configurar)

### 1. Pré-requisitos
- Node.js 20+
- Conta Supabase
- Conta Mercado Pago (com chave Pix)
- Expo CLI (para o app mobile)

### 2. Configurar variáveis de ambiente

Crie `.env.local` em `apps/web` e `.env` no mobile:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
```

### 3. Instalar e rodar

```bash
# na raiz
npm install

# web
cd apps/web && npm run dev

# mobile
cd apps/mobile && npx expo start
```

---

## 📋 Funcionalidades do MVP

### Cliente (Site + App)
- [x] Listagem de produtos com filtros (categoria, preço, tamanho)
- [x] Página de detalhe do produto
- [x] Carrinho
- [x] Checkout com endereço
- [x] Geração de Pix (QR + copia e cola)
- [x] Acompanhamento do pedido
- [x] Histórico de compras

### Admin
- [x] Login protegido
- [x] CRUD de produtos (com upload de fotos)
- [x] Lista de pedidos em fila
- [x] Status: pendente → pago → em separação → enviado → entregue
- [x] Visualização de entregas do dia (rotas)
- [x] Dashboard simples (vendas do dia/semana)

### Automação
- Webhook Mercado Pago atualiza status automaticamente
- Notificações (futuro: WhatsApp / push)

---

## 🔐 Segurança

- Pagamento **somente Pix** (sem cartão → zero risco de clonagem)
- Row Level Security (RLS) no Supabase
- Admin só acessa com role `admin`
- Webhook validado com assinatura do Mercado Pago

---

## 📦 Próximos passos recomendados

1. Criar projeto no Supabase e rodar a migration
2. Configurar Mercado Pago (modo teste primeiro)
3. Subir o Next.js na Vercel
4. Buildar o app com EAS (Expo Application Services)
5. Testar fluxo completo de compra + entrega

---

**Feito com carinho para o MIF BRECHO** 💕
