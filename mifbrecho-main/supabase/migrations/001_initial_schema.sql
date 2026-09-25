-- Mifre Brechó - Schema inicial
-- Rode no SQL Editor do Supabase ou via CLI

-- Extensões
create extension if not exists "uuid-ossp";

-- ======================
-- PROFILES (usuários)
-- ======================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para criar profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ======================
-- CATEGORIES
-- ======================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ======================
-- PRODUCTS
-- ======================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price integer not null check (price >= 0), -- centavos
  size text,
  brand text,
  condition text, -- Novo, Seminovo, Usado
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'sold', 'reserved', 'hidden')),
  stock integer not null default 1 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_status_idx on public.products(status);
create index products_category_idx on public.products(category_id);

-- ======================
-- PRODUCT IMAGES
-- ======================
create table public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id);

-- ======================
-- ADDRESSES (endereços dos clientes)
-- ======================
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text, -- Casa, Trabalho...
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ======================
-- ORDERS
-- ======================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.profiles(id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  total_amount integer not null check (total_amount >= 0), -- centavos
  pix_qr_code text,
  pix_copy_paste text,
  pix_payment_id text, -- ID do Mercado Pago
  shipping_street text not null,
  shipping_number text not null,
  shipping_complement text,
  shipping_neighborhood text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_zip_code text not null,
  shipping_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);

-- ======================
-- ORDER ITEMS
-- ======================
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

create index order_items_order_idx on public.order_items(order_id);

-- ======================
-- RLS (Row Level Security)
-- ======================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles
create policy "Usuários veem próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários atualizam próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Categories: todos leem, só admin escreve
create policy "Todos veem categorias"
  on public.categories for select
  using (true);

create policy "Admin gerencia categorias"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Products: todos veem available, admin gerencia tudo
create policy "Todos veem produtos disponíveis"
  on public.products for select
  using (status = 'available' or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admin gerencia produtos"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Product images
create policy "Todos veem imagens"
  on public.product_images for select
  using (true);

create policy "Admin gerencia imagens"
  on public.product_images for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Addresses
create policy "Usuário gerencia seus endereços"
  on public.addresses for all
  using (auth.uid() = user_id);

-- Orders
create policy "Cliente vê seus pedidos"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "Cliente cria pedido"
  on public.orders for insert
  with check (auth.uid() = customer_id);

create policy "Admin vê todos os pedidos"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin atualiza pedidos"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Order items
create policy "Cliente vê itens dos seus pedidos"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and customer_id = auth.uid()
    )
  );

create policy "Admin vê todos os itens"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Sistema insere itens (via service role ou trigger)"
  on public.order_items for insert
  with check (true); -- ajustar conforme necessário

-- ======================
-- Storage bucket para imagens
-- ======================
-- No painel do Supabase: Storage → New bucket → "product-images" (public)
-- Policy de upload só para admin.

-- Função helper para atualizar updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
