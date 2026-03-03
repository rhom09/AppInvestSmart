-- =============================================
-- A5: Carteira tables for InvestSmart
-- Run this SQL in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ─── Table: carteira_ativos ────────────────────────────────────────────────
create table if not exists public.carteira_ativos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  tipo        text check (tipo in ('acao', 'fii', 'etf', 'renda_fixa')) default 'acao',
  quantidade  decimal(18,6) not null default 1,
  preco_medio decimal(18,6) not null default 0,
  data_compra date,
  created_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.carteira_ativos enable row level security;

create policy "Users can view own ativos"
  on public.carteira_ativos for select
  using (auth.uid() = user_id);

create policy "Users can insert own ativos"
  on public.carteira_ativos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ativos"
  on public.carteira_ativos for update
  using (auth.uid() = user_id);

create policy "Users can delete own ativos"
  on public.carteira_ativos for delete
  using (auth.uid() = user_id);

-- Index for fast user queries
create index if not exists idx_carteira_ativos_user_id on public.carteira_ativos(user_id);

-- ─── Table: alertas ────────────────────────────────────────────────────────
create table if not exists public.alertas (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ticker     text not null,
  tipo       text check (tipo in ('preco_alvo', 'score_minimo', 'dy_minimo')) not null,
  valor      decimal(18,6) not null,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.alertas enable row level security;

create policy "Users can view own alertas"
  on public.alertas for select
  using (auth.uid() = user_id);

create policy "Users can insert own alertas"
  on public.alertas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alertas"
  on public.alertas for update
  using (auth.uid() = user_id);

create policy "Users can delete own alertas"
  on public.alertas for delete
  using (auth.uid() = user_id);

-- Index for fast user queries
create index if not exists idx_alertas_user_id on public.alertas(user_id);
