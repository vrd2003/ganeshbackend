create extension if not exists pgcrypto;

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null check (length(trim(contributor_name)) > 0),
  amount numeric(12, 2) not null check (amount >= 1),
  contribution_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenditures (
  id uuid primary key default gen_random_uuid(),
  reason text not null check (length(trim(reason)) > 0),
  amount numeric(12, 2) not null check (amount >= 1),
  expense_date date not null,
  receipt_url text,
  receipt_file_name text,
  receipt_file_type text,
  created_at timestamptz not null default now()
);

create index if not exists contributions_date_idx on public.contributions (contribution_date);
create index if not exists expenditures_date_idx on public.expenditures (expense_date);
create index if not exists contributions_created_at_idx on public.contributions (created_at desc);
create index if not exists expenditures_created_at_idx on public.expenditures (created_at desc);

alter table public.contributions enable row level security;
alter table public.expenditures enable row level security;

-- The API uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS on the server.
