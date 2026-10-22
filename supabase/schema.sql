-- Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 7 and 25),
  event text not null check (char_length(event) between 1 and 80),
  date date,
  message text,
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Completed','Cancelled'))
);

create table if not exists public.app_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.app_admins enable row level security;

-- Admins can only see their own allow-list row.
drop policy if exists "admins can read own allow-list entry" on public.app_admins;
create policy "admins can read own allow-list entry" on public.app_admins
  for select to authenticated using (id = (select auth.uid()));

-- Only explicitly allow-listed signed-in admins can read and update bookings.
drop policy if exists "admins can read bookings" on public.bookings;
create policy "admins can read bookings" on public.bookings
  for select to authenticated using (
    exists (select 1 from public.app_admins a where a.id = (select auth.uid()))
  );
drop policy if exists "admins can update bookings" on public.bookings;
create policy "admins can update bookings" on public.bookings
  for update to authenticated using (
    exists (select 1 from public.app_admins a where a.id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.app_admins a where a.id = (select auth.uid()))
  );

-- Browser clients must not insert bookings directly; the Vercel function inserts using
-- the server-only service role key. Do not add public INSERT policies.
grant select, update on public.bookings to authenticated;
grant select on public.app_admins to authenticated;
