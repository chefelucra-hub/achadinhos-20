create extension if not exists pgcrypto;
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null,
  price numeric(10,2) not null check (price > 0), category text not null,
  subcategory text not null, affiliate_url text not null, image_url text not null,
  active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "visitantes leem produtos ativos" on public.products for select using (active = true and price <= 20);
create policy "proprietario le todos" on public.products for select to authenticated using (auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid);
create policy "proprietario cadastra" on public.products for insert to authenticated with check (auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid);
create policy "proprietario atualiza" on public.products for update to authenticated using (auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid) with check (auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid);
create policy "proprietario exclui" on public.products for delete to authenticated using (auth.uid() = 'a72dffcb-a319-463c-917d-d5ed9cb55147'::uuid);
